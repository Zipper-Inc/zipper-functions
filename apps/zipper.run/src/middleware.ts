// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import relay from './utils/relay-middleware';
import getVersionFromUrl, {
  VERSION_DELIMETER,
} from './utils/get-version-from-url';

export default async function middleware(request: NextRequest) {
  const version = getVersionFromUrl(request.url);
  const versionPath = version ? `/${VERSION_DELIMETER}${version}` : '';
  const rootPath = request.nextUrl.pathname.replace(versionPath, '') || '/';

  switch (rootPath) {
    case '/':
      if (request.method === 'GET') {
        const url = new URL('/app', request.url);
        return NextResponse.rewrite(url);
      }
      if (request.method === 'POST') {
        const url = new URL('/call', request.url);
        return NextResponse.rewrite(url);
      }
      break;

    case '/call':
      return relay(request);

    default:
      return NextResponse.next();
  }
}
