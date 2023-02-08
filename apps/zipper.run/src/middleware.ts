// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import serveRelay from './utils/relay-middleware';
import getVersionFromUrl, {
  VERSION_DELIMETER,
} from './utils/get-version-from-url';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';

const { __DEBUG__ } = process.env;

export default async function middleware(request: NextRequest) {
  const version = getVersionFromUrl(request.url);
  const versionPath = version ? `/${VERSION_DELIMETER}${version}` : '';

  /** Path after app-slug.zipper.run/@version */
  const appRoute = request.nextUrl.pathname.replace(versionPath, '') || '/';

  if (__DEBUG__) console.log('middleware', { appRoute });

  switch (appRoute) {
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

    case '/api':
    case '/api/json':
      return jsonHandler(request);

    case '/api/yaml':
      return yamlHandler(request);

    case '/call':
      return serveRelay(request);

    default:
      return NextResponse.next();
  }
}
