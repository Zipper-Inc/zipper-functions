// middleware.ts
import { getAuth, withClerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import serveRelay from './utils/relay-middleware';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';
import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';

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

    case /\/relay(\/?)$/.test(appRoute): {
      console.log('matching relay route');
      res = await serveRelay({ request, bootOnly: false });
      break;
    }

    case /\/boot(\/?)$/.test(appRoute): {
      console.log('matching boot route (it rhymes)');
      res = await serveRelay({ request, bootOnly: true });
      break;
    }

    case /^\/$/.test(appRoute): {
      if (request.method === 'GET') {
        const url = new URL('/main.ts', request.url);
        res = NextResponse.rewrite(url);
      }
      if (request.method === 'POST') {
        const url = new URL('/relay', request.url);
        res = NextResponse.rewrite(url);
      }
      break;
    }
  }

  if (!auth.userId && !request.cookies.get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)) {
    res.cookies.set(
      ZIPPER_TEMP_USER_ID_COOKIE_NAME,
      `temp__${crypto.randomUUID()}`,
    );
  }

  return res;
});

export const config = {
  matcher: '/((?!_next/image|_next/static|favicon.ico).*)',
};
