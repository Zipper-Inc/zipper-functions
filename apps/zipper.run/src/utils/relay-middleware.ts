import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import addAppRun from './add-app-run';
import getAppInfo from './get-app-info';
import getInputFromRequest from './get-input-from-request';
import getValidSubdomain from './get-valid-subdomain';
import getVersionFromUrl from './get-version-from-url';

export async function relayRequest(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return { status: 404 };

  // Get app info from Zipper API
  const appInfoResult = await getAppInfo(subdomain);
  if (!appInfoResult.ok) return { status: 404 };

  // Get a version from URL or use the latest
  const version =
    getVersionFromUrl(request.url) ||
    appInfoResult.data.app.lastDeploymentVersion ||
    Date.now().toString();

  const { app } = appInfoResult.data;
  const deploymentId = `${app.id}@${version}`;
  const relayUrl = new URL(`/${deploymentId}`, process.env.RELAY_URL);

  let relayBody;
  if (request.method === 'GET') {
    relayUrl.search = request.nextUrl.search;
  } else {
    relayBody = await request.text();
  }

  /**
   * @todo
   * We should really just the relay logic here
   * that way we're eliminating as many hops as possible
   * rn, we're relaying the relay 🤪
   */
  const response = await fetch(relayUrl.toString(), {
    method: request.method,
    body: relayBody,
  });

  const result = await response.text();
  const { status, headers } = response;

  addAppRun({
    appId: app.id,
    deploymentId,
    success: response.status === 200,
    scheduleId: request.headers.get('X-Zipper-Schedule-Id') || undefined,
    inputs: await getInputFromRequest(request),
    result,
  });

  return { result, status, headers };
}

export default async function serveRelay(request: NextRequest) {
  const { result, status, headers } = await relayRequest(request);
  if (status === 404) return NextResponse.redirect('/404');
  return new NextResponse(result, {
    status,
    headers,
  });
}
