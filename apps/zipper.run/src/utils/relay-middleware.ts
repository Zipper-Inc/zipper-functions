import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import addAppRun from './add-app-run';
import getAppInfo from './get-app-info';
import getValidSubdomain from './get-valid-subdomain';
import getVersionFromUrl from './get-version-from-url';

export default async function relay(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return NextResponse.rewrite('/404');

  // Get app info from Zipper API
  const appInfoResult = await getAppInfo(subdomain);
  if (!appInfoResult.ok) return NextResponse.rewrite('/404');

  // Get a version from URL or use the latest
  const version =
    getVersionFromUrl(request.url) ||
    appInfoResult.data.app.lastDeploymentVersion ||
    Date.now().toString();

  const { app } = appInfoResult.data;
  const deploymentId = `${app.id}@${version}`;
  const relayUrl = new URL(`/${deploymentId}`, process.env.RELAY_URL);
  relayUrl.search = request.nextUrl.search;

  /**
   * @todo
   * instead of rewriting to Deno, we should really just do the relay logic here
   * that way we're eliminating as many hops as possible
   */
  const response = NextResponse.rewrite(relayUrl);

  /**
   * @todo
   * figure out how to do inputs and outputs 🤔
   */
  addAppRun({
    appId: app.id,
    deploymentId,
    success: response.status === 200,
    scheduleId: request.headers.get('X-Zipper-Schedule-Id') || undefined,
    inputs: {},
    result: {},
  });

  return response;
}
