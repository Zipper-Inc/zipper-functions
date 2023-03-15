// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import serveRelay from './utils/relay-middleware';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';
import {
  FILENAME_DELIMETER,
  getFilenameFromUrl,
  getVersionFromUrl,
  VERSION_DELIMETER,
} from './utils/get-values-from-url';

const { __DEBUG__ } = process.env;

export default async function middleware(request: NextRequest) {
  const version = getVersionFromUrl(request.url);
  const filename = getFilenameFromUrl(request.url);
  const versionPath = version ? `/${VERSION_DELIMETER}${version}` : '';
  const filenamePath = filename ? `/${FILENAME_DELIMETER}${filename}` : '';

  /** Path after app-slug.zipper.run/@version */
  let appRoute = request.nextUrl.pathname.replace(versionPath, '') || '/';
  appRoute = appRoute.replace(filenamePath, '') || '/';

  if (__DEBUG__) console.log('middleware', { appRoute });

  let res: NextResponse = NextResponse.next();
  switch (true) {
    case /\/api(\/?)$/.test(appRoute):
    case /\/api\/json(\/?)$/.test(appRoute): {
      console.log('matching json api route');
      res = await jsonHandler(request);
      break;
    }

    case /\/api\/yaml(\/?)$/.test(appRoute): {
      console.log('matching yaml api route');
      res = await yamlHandler(request);
      break;
    }

    case /\/call(\/?)$/.test(appRoute): {
      console.log('matching call route');
      res = await serveRelay(request);
      break;
    }

    case /^\/$/.test(appRoute): {
      if (request.method === 'GET') {
        const url = new URL('/app', request.url);
        res = NextResponse.rewrite(url);
      }
      if (request.method === 'POST') {
        const url = new URL('/call', request.url);
        res = NextResponse.rewrite(url);
      }
      break;
    }
  }

  if (!request.cookies.get('__zipper_user_id')) {
    res.cookies.set('__zipper_user_id', `temp__${crypto.randomUUID()}`);
  }

  return res;
}
