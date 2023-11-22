import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as jose from 'jose';
import addAppRun from './add-app-run';
import {
  fetchBootInfoCachedWithUserOrThrow,
  fetchDeploymentCachedOrThrow,
} from './get-boot-info';
import getValidSubdomain from './get-valid-subdomain';
import { getFilenameAndVersionFromPath } from './get-values-from-url';
import {
  formatDeploymentId,
  getAppLink,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  uuid,
  ZIPPER_TEMP_USER_ID_HEADER,
  webCryptoDecryptFromBase64,
  parseBody,
  noop,
} from '@zipper/utils';
import Zipper from '@zipper/framework';
import { getZipperAuth } from './get-zipper-auth';

const { __DEBUG__, DENO_DEPLOY_SECRET, PUBLICLY_ACCESSIBLE_RPC_HOST } =
  process.env;

const DEPLOY_KID = 'zipper';
const DENO_ORIGIN = new URL(`https://subhosting-v1.deno-aws.net`);
const RPC_ROOT = `https://${PUBLICLY_ACCESSIBLE_RPC_HOST}/api/deno/v0/`;

const SENSITIVE_DATA_PLACEHOLDER = '********';

const X_FORWARDED_HOST = 'x-forwarded-host';
const X_DENO_SUBHOST = 'x-deno-subhost';
const X_ZIPPER_DEPLOYMENT_ID = 'x-zipper-deployment-id';
const X_ZIPPER_SUBDOMAIN = 'x-zipper-subdomain';

const HEALTH_CHECK_SLUG = 'healthcheck';

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
  subdomain: string,
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
    [X_ZIPPER_DEPLOYMENT_ID]: deploymentId,
    [X_ZIPPER_SUBDOMAIN]: subdomain,
  };
}

function encodeJWT(deploymentId: string) {
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(DENO_DEPLOY_SECRET);
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
    version: versionPassedIn,
    filename: filenamePassedIn,
  }: {
    request: NextRequest;
    version?: string;
    filename?: string;
  },
  bootOnly = false,
) {
  if (!DENO_DEPLOY_SECRET || !PUBLICLY_ACCESSIBLE_RPC_HOST)
    return {
      status: 500,
      result: 'Missing environment variables',
    };

  const host =
    request.headers.get('x-zipper-host') || request.headers.get('host') || '';
  if (__DEBUG__) console.log('request headers', request.headers);
  const subdomain = getValidSubdomain(host);
  if (__DEBUG__) console.log('getValidSubdomain', { host, subdomain });
  if (!subdomain) return { status: 404 };

  // Get the user's JWT token from the session if there is one
  const zipperAuth = await getZipperAuth(request as any);
  let token = request.headers
    .get('Authorization')
    ?.replace('Bearer', '')
    .trim();
  token = token || zipperAuth.token || undefined;

  let tempUserId = request.headers.get(ZIPPER_TEMP_USER_ID_HEADER) || undefined;
  tempUserId =
    tempUserId ||
    request.cookies.get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)?.value.toString();

  const patchedUrl = getPatchedUrl(request);
  const relayUrl = !bootOnly ? patchedUrl : new URL('/__BOOT__', patchedUrl);

  const deployment = await fetchDeploymentCachedOrThrow(subdomain).catch(noop);
  if (!deployment || !deployment.appId) return { status: 404 };

  const { appId, version: latestVersion } = deployment;
  const version = versionPassedIn || latestVersion;

  const deploymentId = formatDeploymentId({
    appId: appId,
    version,
    uniqueOverride:
      !bootOnly && subdomain === HEALTH_CHECK_SLUG
        ? Date.now().toString(32)
        : undefined,
  });

  if (bootOnly) {
    const response = await fetch(relayUrl, {
      method: 'POST',
      headers: await getPatchedHeaders(
        request,
        deploymentId,
        relayUrl.hostname,
        subdomain,
      ),
    });
    const { status, headers } = response;
    const mutableHeaders = new Headers(headers);
    const result = await response.text();
    return { result, status, headers: mutableHeaders };
  }

  let filename = filenamePassedIn || 'main.ts';
  if (!filename.endsWith('.ts')) {
    filename = `${filename}.ts`;
  }

  let bootInfo;
  try {
    bootInfo = await fetchBootInfoCachedWithUserOrThrow({
      subdomain,
      tempUserId,
      filename,
      token,
      deploymentId,
    });
  } catch (e: any) {
    const errorStatus = e?.status || 500;
    return {
      status: errorStatus,
      result: JSON.stringify({
        ok: false,
        status: errorStatus,
        error: e.message,
        errorClass: 'Boot',
      }),
    };
  }

  const { app, userAuthConnectors, userInfo } = bootInfo;

  const runId = request.headers.get('x-zipper-run-id') || uuid();
  const userConnectorTokens: Record<string, string> = {};

  await Promise.all(
    userAuthConnectors
      .filter((uac) => uac.isUserAuthRequired)
      .map(async (uac) => {
        if (uac.appConnectorUserAuths[0]) {
          const token = await webCryptoDecryptFromBase64(
            uac.appConnectorUserAuths[0]?.encryptedAccessToken,
            process.env.ENCRYPTION_KEY!,
          );

          userConnectorTokens[uac.appConnectorUserAuths[0].connectorType] =
            token;
        }
      }),
  );

  if (
    Object.keys(userConnectorTokens).length > 0 &&
    !userInfo.userId &&
    !tempUserId
  ) {
    throw new Error('missing user ID');
  }

  const body = await parseBody(request);
  const queryParameters = Object.fromEntries(relayUrl.searchParams.entries());

  const relayBody: Zipper.Relay.RequestBody = {
    appInfo: {
      id: app.id,
      slug: app.slug,
      version,
      url: `https://${getAppLink(app.slug)}`,
      connectorsWithUserAuth: Object.keys(userConnectorTokens),
    },
    inputs: request.method === 'GET' ? queryParameters : body,
    originalRequest: {
      url: request.nextUrl.toString(),
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      body: body,
      queryParameters,
    },
    runId,
    userId: userInfo.userId || tempUserId || '',
    userConnectorTokens,
  };

  relayBody.userInfo = {
    userId: userInfo.userId || tempUserId || '',
    email: userInfo.email,
    displayName: '',
    canUserEdit: userInfo.canUserEdit,
  };

  relayBody.path = filename;

  const response = await fetch(relayUrl, {
    method: 'POST',
    body: JSON.stringify(relayBody),
    headers: await getPatchedHeaders(
      request,
      deploymentId,
      relayUrl.hostname,
      subdomain,
    ),
  });

  const { status, headers } = response;
  const mutableHeaders = new Headers(headers);
  const result = await response.text();

  const appRunRes = await addAppRun({
    id: runId,
    appId: app.id,
    deploymentId,
    success: response.status === 200,
    scheduleId: request.headers.get('x-zipper-schedule-id') || undefined,
    rpcBody: app.isDataSensitive
      ? { ...relayBody, inputs: { [SENSITIVE_DATA_PLACEHOLDER]: '' } }
      : relayBody,
    result: app.isDataSensitive ? SENSITIVE_DATA_PLACEHOLDER : result,
  });
  mutableHeaders.set('x-zipper-run-id', await appRunRes.text());

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
    bootOnly ? ['boot'] : ['relay', 'raw'],
  );

  console.log('version: ', version || 'latest');
  if (!bootOnly) console.log('filename: ', filename);

  const { result, status, headers } = await relayRequest(
    {
      request,
      version,
      filename,
    },
    bootOnly,
  );

  const mutableHeaders = new Headers(headers);
  if (request.method !== 'GET')
    mutableHeaders?.append('Access-Control-Allow-Origin', '*');

  if (status === 404) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  if (status >= 500) {
    return new NextResponse(
      JSON.stringify({
        $zipperType: 'Zipper.Component',
        type: 'stack',
        props: {
          direction: 'column',
        },
        children: [
          {
            $zipperType: 'Zipper.Component',
            type: 'markdown',
            props: {},
            children: [
              '### Looks like something went wrong',
              `\`\`\`${result}`,
            ],
          },
          {
            $zipperType: 'Zipper.Component',
            type: 'markdown',
            props: {},
            children: ['---', "#### If you're stuck, we can help"],
          },
          {
            'Schedule a debug call': {
              $zipperType: 'Zipper.Component',
              type: 'markdown',
              props: {},
              children: [
                '[Book here](https://cal.com/team/zipper-inc/help-me)',
              ],
            },
            'Email support': {
              $zipperType: 'Zipper.Component',
              type: 'markdown',
              props: {},
              children: [
                '[support@zipper.works](emailto:support@zipper.works)',
              ],
            },
          },
        ],
      }),
      {
        status,
        headers: mutableHeaders,
      },
    );
  }

  return new NextResponse(result, {
    status,
    headers: mutableHeaders,
  });
}
