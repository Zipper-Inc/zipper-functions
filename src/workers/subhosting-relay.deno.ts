#!/usr/bin/env -S deno run --allow-net --allow-read --allow-env --unstable

// Copyright Deno Land Inc. All Rights Reserved. Proprietary and confidential.

/**
 * This is an example of a subhosting relay, it's essentially a reverse-proxy
 * that sends traffic to Deno Deploy and injects special headers, specifically:
 * a JWT in x-deno-subhost and the original hostname in x-forwarded-host.
 *
 * Deno Deploy transparently manages isolate lifetimes & load-balancing.
 * After relaying a request you can expect RPC calls back to your origin.
 */

import { serve } from 'https://deno.land/std@0.118.0/http/mod.ts';
import * as jose from 'https://deno.land/x/jose@v4.3.7/index.ts';

// Subhoster credentials
const {
  SHARED_SECRET, // e.g: 256 bit secret
  DEPLOY_KID, // e.g: "acme"
  RPC_HOST, // e.g: http://zipper.works
} = Deno.env.toObject();
const DENO_ORIGIN = new URL(`https://subhosting-v1.deno-aws.net`);
const RPC_PATH = `/api/deno/v0/`;

const X_FORWARDED_HOST = 'x-forwarded-host';
const X_DENO_SUBHOST = 'x-deno-subhost';
const ZIPPER_RPC_ROOT = '__zipperRpcRoot';

async function relayTo(req: Request, appId: string, xHost = undefined) {
  const [url, init] = await patchedReq(req, appId, xHost);

  return await fetch(url, init);
}

async function patchedReq(
  req: Request,
  deploymentId: string,
  xHostOverride = undefined,
): Promise<[URL, RequestInit]> {
  // Parse & patch URL (preserve path and querystring)
  let rpcRoot = `${RPC_HOST}${RPC_PATH}`;
  const url = new URL(req.url);
  url.host = DENO_ORIGIN.host;
  url.port = DENO_ORIGIN.port;
  url.protocol = DENO_ORIGIN.protocol;
  if (url.searchParams.has(ZIPPER_RPC_ROOT)) {
    rpcRoot = url.searchParams.get(ZIPPER_RPC_ROOT) as string;
    url.searchParams.delete(ZIPPER_RPC_ROOT);
  }

  // Patch Headers
  const xHost = xHostOverride ?? url.hostname;
  const xDeno = await encodeJWT(deploymentId, rpcRoot);
  const reqHeaders = Object.fromEntries(req.headers.entries());
  const xHeaders = {
    [X_FORWARDED_HOST]: xHost,
    [X_DENO_SUBHOST]: xDeno,
  };
  const headers = Object.assign(reqHeaders, xHeaders);
  // Patch request (preserving original body & method)

  return [
    url,
    {
      headers,
      body: req.body,
      method: req.method,
    },
  ];
}

function encodeJWT(deploymentId: string, rpcRoot: string) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(SHARED_SECRET);
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 15 * 60; // 15mn exp
  const claims = {
    deployment_id: deploymentId, // Required
    rpc_root: rpcRoot, // Optional RPC root override
    // Required std JWT fields
    exp,
    iat,
  };
  const header = { typ: 'JWT', alg: 'HS256', kid: DEPLOY_KID };
  return new jose.SignJWT(claims).setProtectedHeader(header).sign(secretKey);
}

function serveInternalError(err: Error) {
  console.error('error?', err);
  return new Response(`${err.stack}`, { status: 500 });
}

export async function serveRelay(req: Request) {
  const url = new URL(req.url);
  const deploymentId = url.pathname.replace(/^\/+/, '');
  const [appId, version] = deploymentId.split('@');
  console.log('booting app', appId, 'version', version);
  return await relayTo(req, deploymentId);
}

if (import.meta.main) {
  const port =
    typeof location !== 'undefined'
      ? parseInt(location.port)
      : parseInt(Deno.args?.[0] ?? 0);
  const hostname = '0.0.0.0';
  serve((req) => serveRelay(req).catch(serveInternalError), { port, hostname });
  console.log(`Listening on http://${hostname}:${port}`);
}
