import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as jose from 'jose';
import addAppRun from './add-app-run';
import getAppInfo from './get-app-info';
import getValidSubdomain from './get-valid-subdomain';
import { getFilenameAndVersionFromPath } from './get-values-from-url';
import { getAuth } from '@clerk/nextjs/server';
import {
  formatDeploymentId,
  getAppLink,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  uuid,
} from '@zipper/utils';
import Zipper from '@zipper/framework';

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

export async function relayRequest(
  {
    request,
    version: _version,
    filename: _filename,
    bearerToken,
  }: {
    request: NextRequest;
    version?: string;
    filename?: string;
    bearerToken?: string;
  },
  bootOnly = false,
) {
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
  const token = await auth.getToken({ template: 'incl_orgs' });

  const tempUserId = request.cookies
    .get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)
    ?.value.toString();

  let filename = _filename || 'main.ts';
  if (!filename.endsWith('.ts')) {
    filename = `${filename}.ts`;
  }

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

  const { app, userAuthConnectors, userInfo } = appInfoResult.data;

  // Get a version from URL or use the latest
  const version =
    _version || app.lastDeploymentVersion || Date.now().toString(32);

  const requiredAuthUserId = userAuthConnectors.find(
    (c) => c.isUserAuthRequired,
  )
    ? auth.userId || tempUserId
    : undefined;
  const deploymentId = formatDeploymentId({
    appId: app.id,
    version,
    userId: requiredAuthUserId,
  });

  let relayUrl = getPatchedUrl(request);

  if (bootOnly) {
    relayUrl = new URL('/__BOOT__', relayUrl);
  }

  const runId = request.headers.get('x-zipper-run-id') || uuid();

  const relayBody: Zipper.Relay.RequestBody = {
    appInfo: {
      id: app.id,
      slug: app.slug,
      version,
      url: `https://${getAppLink(app.slug)}`,
    },
    originalRequest: { method: request.method, url: request.url },
    inputs:
      request.method === 'GET'
        ? Object.fromEntries(relayUrl.searchParams.entries())
        : JSON.parse(await request.text()),
    runId,
  };

  relayBody.userInfo = userInfo;

  relayBody.path = filename;

  const response = await fetch(relayUrl, {
    method: 'POST',
    body: JSON.stringify(relayBody),
    headers: await getPatchedHeaders(request, deploymentId, relayUrl.hostname),
  });

  const { status, headers } = response;
  const result = await response.text();

  const appRunRes = await addAppRun({
    id: runId,
    appId: app.id,
    deploymentId,
    success: response.status === 200,
    scheduleId: request.headers.get('x-zipper-schedule-id') || undefined,
    rpcBody: relayBody,
    result,
  });
  headers.set('x-zipper-run-id', await appRunRes.text());

  return { result, status, headers };
}

export default async function serveRelay({
  request,
  bootOnly,
}: {
  request: NextRequest;
  bootOnly: boolean;
}) {
  const { version, filename } = getFilenameAndVersionFromPath(
    request.nextUrl.pathname,
    bootOnly ? ['boot'] : ['call'],
  );

  const { result, status, headers } = await relayRequest(
    {
      request,
      version,
      filename,
      bearerToken: request.headers.get('Authorization')?.replace('Bearer ', ''),
    },
    bootOnly,
  );
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
