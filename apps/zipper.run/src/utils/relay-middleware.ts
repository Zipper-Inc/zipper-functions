import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as jose from 'jose';
import addAppRun from './add-app-run';
import getAppInfo from './get-app-info';
import getInputFromRequest from './get-input-from-request';
import getValidSubdomain from './get-valid-subdomain';
import getVersionFromUrl from './get-version-from-url';

const { __DEBUG__, SHARED_SECRET: DENO_SHARED_SECRET, RPC_HOST } = process.env;

const DEPLOY_KID = 'zipper';
const DENO_ORIGIN = new URL(`https://subhosting-v1.deno-aws.net`);
const RPC_ROOT = `${RPC_HOST}/api/deno/v0/`;

const X_FORWARDED_HOST = 'x-forwarded-host';
const X_DENO_SUBHOST = 'x-deno-subhost';

function getPatchedUrl(req: NextRequest) {
  // preserve path and querystring)
  const url = new URL(req.url);
  url.host = DENO_ORIGIN.host;
  url.port = DENO_ORIGIN.port;
  url.protocol = DENO_ORIGIN.protocol;
  return url;
}

async function getPatchedHeaders(
  request: NextRequest,
  deploymentId: string,
  xHost: string,
) {
  const originalHeaders = Object.fromEntries(request.headers.entries());
  const xDeno = await encodeJWT(deploymentId);

  // remove the original host header
  // if we don't, we'll get a security error from deno
  delete originalHeaders.host;

  return {
    ...originalHeaders,
    [X_FORWARDED_HOST]: xHost,
    [X_DENO_SUBHOST]: xDeno,
  };
}

function encodeJWT(deploymentId: string) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(DENO_SHARED_SECRET);
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 15 * 60; // 15mn exp
  const claims = {
    deployment_id: deploymentId, // Required
    rpc_root: RPC_ROOT, // Optional RPC root override
    // Required std JWT fields
    exp,
    iat,
  };
  const header = { typ: 'JWT', alg: 'HS256', kid: DEPLOY_KID };
  return new jose.SignJWT(claims).setProtectedHeader(header).sign(secretKey);
}

export async function relayRequest(request: NextRequest) {
  if (!DENO_SHARED_SECRET || !RPC_HOST)
    return {
      status: 500,
      result: 'Missing environment variables',
    };

  const host = request.headers.get('host') || '';
  const subdomain = getValidSubdomain(host);
  if (__DEBUG__) console.log('getValidSubdomain', { host, subdomain });
  if (!subdomain) return { status: 404 };

  const zipperUserId = request.cookies
    .get('__zipper_user_id')
    ?.value.toString();
  // Get app info from Zipper API
  const appInfoResult = await getAppInfo(subdomain, zipperUserId);
  if (__DEBUG__) console.log('getAppInfo', { result: appInfoResult });

  if (!appInfoResult.ok) return { status: 500, result: appInfoResult.error };

  const { app, connectors } = appInfoResult.data;

  // Get a version from URL or use the latest
  const version =
    getVersionFromUrl(request.url) ||
    app.lastDeploymentVersion ||
    Date.now().toString(32);

  let deploymentId = `${app.id}@${version}`;
  if (connectors.find((c) => c.isUserAuthRequired)) {
    deploymentId = `${deploymentId}@${zipperUserId}`;
  }

  const relayUrl = getPatchedUrl(request);
  const relayBody = request.method === 'GET' ? undefined : await request.text();

  const response = await fetch(relayUrl, {
    method: request.method,
    body: relayBody,
    headers: await getPatchedHeaders(request, deploymentId, relayUrl.hostname),
  });

  const { status, headers } = response;
  const result = await response.text();

  addAppRun({
    appId: app.id,
    deploymentId,
    success: response.status === 200,
    scheduleId: request.headers.get('X-Zipper-Schedule-Id') || undefined,
    inputs: await getInputFromRequest(request, relayBody),
    result,
  });

  return { result, status, headers };
}

export default async function serveRelay(request: NextRequest) {
  const { result, status, headers } = await relayRequest(request);
  if (request.method !== 'GET')
    headers?.append('Access-Control-Allow-Origin', '*');

  if (status === 404) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  if (status >= 500) {
    return new NextResponse(`Error: ${result}`, {
      status,
      headers,
    });
  }

  return new NextResponse(result, {
    status,
    headers,
  });
}
