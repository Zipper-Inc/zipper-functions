// middleware.ts
import { getAuth, withClerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import serveRelay from './utils/relay-middleware';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';

const { __DEBUG__ } = process.env;

export default withClerkMiddleware(async (request: NextRequest) => {
  const appRoute = request.nextUrl.pathname;
  const auth = getAuth(request);
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
    res.cookies.set(
      '__zipper_user_id',
      auth.userId || `temp__${crypto.randomUUID()}`,
    );
  }

  return res;
});

export const config = {
  matcher: '/((?!_next/image|_next/static|favicon.ico).*)',
};
