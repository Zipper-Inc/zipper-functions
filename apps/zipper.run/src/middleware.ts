// middleware.ts
import { authMiddleware } from '@clerk/nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import serveRelay from './utils/relay-middleware';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';

export default authMiddleware({
  async afterAuth(_auth, request: NextRequest) {
    const appRoute = request.nextUrl.pathname;

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

    return res;
  },
});

export const config = {
  matcher: '/((?!_next/image|_next/static|favicon.ico).*)',
};
