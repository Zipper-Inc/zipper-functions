import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import getAppInfo from './get-app-info';
import getValidSubdomain from './get-valid-subdomain';
import getVersionFromUrl from './get-version-from-url';

export default async function relay(request: NextRequest) {
  const host = request.headers.get('host') || '';
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return NextResponse.rewrite('/404');

  // Get app info from Zipper API
  const result = await getAppInfo(subdomain);
  if (!result.ok) return NextResponse.rewrite('/404');

  // Get a version from URL or use the latest
  const version =
    getVersionFromUrl(request.url) ||
    result.data.app.lastDeploymentVersion ||
    Date.now().toString();

  const deploymentId = `${result.data.app.id}@${version}`;
  const relayUrl = new URL(`/${deploymentId}`, process.env.RELAY_URL);
  relayUrl.search = request.nextUrl.search;

  /**
   * @todo
   * instead of rewriting to Deno, we should really just do the relay logic here
   * that way we're eliminating as many hops as possible
   */
  return NextResponse.rewrite(relayUrl);
}
