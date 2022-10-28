/**
 * @note This API endpoint doesnt' work
 * I think its a TLS certificate thing but I don't know
 * Use /run/ which proxies to https://zipper-run.deno.dev/
 *
 */
/** Use zipper-run.deno.dev on deno in the meantime */

import type { NextApiRequest, NextApiResponse } from 'next';
import absoluteUrl from 'next-absolute-url';
import * as jose from 'jose';

type ResponseData = {
  message: string;
  output?: string;
  method?: string;
};

const SHARED_SECRET = process.env.SHARED_SECRET;
const DEPLOY_KID = 'zipper';
const DENO_ORIGIN = new URL(`https://subhosting-v1.deno-aws.net`);
const X_FORWARDED_HOST = 'x-forwarded-host';
const X_DENO_SUBHOST = 'x-deno-subhost';

function encodeJWT(rpcRoot: string, deploymentId: string) {
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

function makeDenoUrl(reqUrl: URL, deploymentId: string) {
  const denoUrl = new URL(reqUrl);
  denoUrl.host = DENO_ORIGIN.host;
  denoUrl.port = DENO_ORIGIN.port;
  denoUrl.protocol = DENO_ORIGIN.protocol;
  denoUrl.pathname = deploymentId;
  return denoUrl;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  const { query, method, body } = req;
  const reqUrl = new URL(`${absoluteUrl(req).origin}${req.url}`);
  const deploymentId = `${query.appId}@${query.version}`;
  const denoUrl = makeDenoUrl(reqUrl, deploymentId);

  // Patch Headers
  const xHost = denoUrl.hostname;
  // RPC Root should be the same origin as this request, for now

  const rpcRoot = `${reqUrl.protocol}://${reqUrl.host}/api/deno/v0/`;
  console.log({ xHost, rpcRoot });
  const xDeno = await encodeJWT(rpcRoot, deploymentId);
  const xHeaders = {
    [X_FORWARDED_HOST]: xHost,
    [X_DENO_SUBHOST]: xDeno,
  };

  const headers = {
    ...(req.headers as Record<string, string>),
    ...xHeaders,
  };

  console.log('relaying app with ID', req.query.appId, headers);

  try {
    const relay = await fetch(denoUrl.toString(), {
      headers,
      method,
      body: null,
    });
    res.status(relay.status).send(relay.body as any);
  } catch (e: any) {
    // console.error(e);
    res.status(500).send(e.stack);
  }
}
