import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as jose from 'jose';
import addAppRun from './add-app-run';
import getAppInfo from './get-app-info';
import getInputFromRequest from './get-input-from-request';
import getValidSubdomain from './get-valid-subdomain';
import { getFilenameAndVersionFromPath } from './get-values-from-url';
import { clerkClient, getAuth } from '@clerk/nextjs/server';

const { __DEBUG__, SHARED_SECRET: DENO_SHARED_SECRET, RPC_HOST } = process.env;

const DEPLOY_KID = 'zipper';
const DENO_ORIGIN = new URL(`https://subhosting-v1.deno-aws.net`);
const RPC_ROOT = `${RPC_HOST}/api/deno/v0/`;

const X_FORWARDED_HOST = 'x-forwarded-host';
const X_DENO_SUBHOST = 'x-deno-subhost';

type RelayRequestBody = {
  inputs: Record<string, any>;
  userInfo?: {
    emails: string[];
    userId?: string;
  };
  path?: string;
};

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
  delete originalHeaders['content-length'];

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

export async function relayRequest({
  request,
  version: _version,
  filename: _filename,
  bearerToken,
}: {
  request: NextRequest;
  version?: string;
  filename?: string;
  bearerToken?: string;
}) {
  if (!DENO_SHARED_SECRET || !RPC_HOST)
    return {
      status: 500,
      result: 'Missing environment variables',
    };

  const host = request.headers.get('host') || '';
  const subdomain = getValidSubdomain(host);
  if (__DEBUG__) console.log('getValidSubdomain', { host, subdomain });
  if (!subdomain) return { status: 404 };

  // Get the user's JWT token from the session if there is one
  const auth = getAuth(request);
  const token = await auth.getToken();

  const tempUserId = request.cookies
    .get('__zipper_temp_user_id')
    ?.value.toString();

  const filename = _filename || 'main.ts';

  const appInfoResult = await getAppInfo({
    subdomain,
    tempUserId,
    filename,
    token: token || bearerToken,
  });
  if (__DEBUG__) console.log('getAppInfo', { result: appInfoResult });

  if (!appInfoResult.ok)
    return {
      status: appInfoResult.error === 'UNAUTHORIZED' ? 401 : 500,
      result: appInfoResult.error,
    };

  const { app, userAuthConnectors } = appInfoResult.data;

  // Get a version from URL or use the latest
  const version =
    _version || app.lastDeploymentVersion || Date.now().toString(32);

  let deploymentId = `${app.id}@${version}`;

  if (userAuthConnectors.find((c) => c.isUserAuthRequired)) {
    deploymentId = `${deploymentId}@${tempUserId || auth.userId}`;
  }

  const relayUrl = getPatchedUrl(request);
  const url = new URL(relayUrl);

  const relayBody: RelayRequestBody =
    request.method === 'GET'
      ? {
          inputs: Object.fromEntries(url.searchParams.entries()),
        }
      : { inputs: JSON.parse(await request.text()) };

  relayBody.userInfo = appInfoResult.data.userInfo;

  relayBody.path = _filename;

  const response = await fetch(relayUrl, {
    method: 'POST',
    body: JSON.stringify(relayBody),
    headers: await getPatchedHeaders(request, deploymentId, relayUrl.hostname),
  });

  const { status, headers } = response;
  const result = await response.text();

  addAppRun({
    appId: app.id,
    deploymentId,
    success: response.status === 200,
    scheduleId: request.headers.get('x-zipper-schedule-id') || undefined,
    inputs: await getInputFromRequest(request, JSON.stringify(relayBody)),
    result,
  });

  return { result, status, headers };
}

export default async function serveRelay(request: NextRequest) {
  const { version, filename } = getFilenameAndVersionFromPath(
    request.nextUrl.pathname,
    ['call'],
  );
  const { result, status, headers } = await relayRequest({
    request,
    version,
    filename,
    bearerToken: request.headers.get('Authorization')?.replace('Bearer ', ''),
  });
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
