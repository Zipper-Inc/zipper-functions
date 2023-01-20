import { Handler, Handlers } from '$fresh/server.ts';
import { config } from 'dotenv';
import * as jose from 'https://deno.land/x/jose@v4.3.7/index.ts';
import { getHttpHandlers } from '../../../utils/get-http-handlers.ts';

// Subhoster credentials
const {
  SHARED_SECRET, // e.g: 256 bit secret
  RPC_HOST, // e.g: http://zipper.works
} = config({ path: '../.env' });

const DEPLOY_KID = 'zipper';
const DENO_ORIGIN = new URL(`https://subhosting-v1.deno-aws.net`);
const RPC_PATH = `/api/deno/v0/`;

const X_FORWARDED_HOST = 'x-forwarded-host';
const X_DENO_SUBHOST = 'x-deno-subhost';
const ZIPPER_RPC_ROOT = '__zipperRpcRoot';

async function relayTo(req: Request, appId: string, xHost = undefined) {
  const [url, init] = await patchRequest(req, appId, xHost);
  return await fetch(url, init);
}

async function patchRequest(
  originalRequest: Request,
  deploymentId: string,
  xHostOverride = undefined,
): Promise<[URL, RequestInit]> {
  let rpcRoot = `${RPC_HOST}${RPC_PATH}`;

  // start with the og URL
  const url = new URL(originalRequest.url);
  url.host = DENO_ORIGIN.host;
  url.port = DENO_ORIGIN.port;
  url.protocol = DENO_ORIGIN.protocol;

  // set the path
  const [, , ...remainingParts] = url.pathname.split('/');
  const path = remainingParts.join('/');
  url.pathname = path;

  // check the query string
  if (url.searchParams.has(ZIPPER_RPC_ROOT)) {
    rpcRoot = url.searchParams.get(ZIPPER_RPC_ROOT) as string;
    url.searchParams.delete(ZIPPER_RPC_ROOT);
  }

  // patch headers
  const originalHeaders = Object.fromEntries(
    (originalRequest.headers as any).entries(),
  );

  const xHost = xHostOverride ?? url.hostname;
  const xDeno = await encodeJWT(deploymentId, rpcRoot);
  const xHeaders = {
    [X_FORWARDED_HOST]: xHost,
    [X_DENO_SUBHOST]: xDeno,
  };

  // return patched request
  return [
    url,
    {
      headers: { ...originalHeaders, ...xHeaders },
      body: originalRequest.body,
      method: originalRequest.method,
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
  return new Response(`${err.stack}`, { status: 500 });
}

export async function serveRelay(req: Request) {
  const url = new URL(req.url);
  const deploymentId = url.pathname.split('/')[1];
  console.log('[RELAY]', deploymentId, '|', `$serving ${url}`);
  return await relayTo(req, deploymentId);
}

export const handler = getHttpHandlers(async (req, ctx) => {
  const { appId, version } = ctx.params;
  const deploymentId = `${appId}@${version}`;
  try {
    return await relayTo(req, deploymentId);
  } catch (e) {
    return serveInternalError(e);
  }
});
