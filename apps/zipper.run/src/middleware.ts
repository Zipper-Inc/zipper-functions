// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import serveRelay from './utils/relay-middleware';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';
import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { getCookie } from 'cookies-next';
import { jwtVerify } from 'jose';

const { __DEBUG__ } = process.env;

/**
 * We use middleware as router to support our custom URLs
 * These urls *end with* a special string, like
 *  - https://my-applet.zipper.run/my-path/api/json
 *  - https://my-applet.zipper.run/@latest/relay
 *
 * If it matches these routes it will take over the request
 * And generate its own response
 */
async function maybeGetCustomResponse(
  appRoute: string,
  request: NextRequest,
): Promise<NextResponse | void> {
  switch (true) {
    case /\/api(\/?)$/.test(appRoute):
    case /\/api\/json(\/?)$/.test(appRoute): {
      console.log('matching json api route');
      return jsonHandler(request);
    }

    case /\/api\/yaml(\/?)$/.test(appRoute): {
      console.log('matching yaml api route');
      return await yamlHandler(request);
    }

    case /\/relay(\/?)$/.test(appRoute): {
      console.log('matching relay route');
      return serveRelay({ request, bootOnly: false });
    }

    case /\/boot(\/?)$/.test(appRoute): {
      console.log('matching boot route (it rhymes)');
      return serveRelay({ request, bootOnly: true });
    }

    case /^\/$/.test(appRoute): {
      if (request.method === 'GET') {
        const url = new URL('/main.ts', request.url);
        return NextResponse.rewrite(url);
      }
      if (request.method === 'POST') {
        const url = new URL('/relay', request.url);
        return NextResponse.rewrite(url);
      }
    }
  }
}

export const middleware = async (request: NextRequest) => {
  const zipperAccessToken = getCookie('__zipper_token') as string | undefined;
  const zipperRefreshToken = getCookie('__zipper_refresh') as
    | string
    | undefined;

  if (zipperAccessToken) {
    const { payload } = await jwtVerify(
      zipperAccessToken,
      new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!),
    );

    console.log(payload);
  }

  const appRoute = request.nextUrl.pathname;
  if (__DEBUG__) console.log('middleware', { appRoute });

  const customResponse = await maybeGetCustomResponse(appRoute, request);
  const response = customResponse || NextResponse.next();

  // if (!auth.userId && !request.cookies.get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)) {
  //   response.cookies.set(
  //     ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  //     `temp__${crypto.randomUUID()}`,
  //   );
  // }

  return response;
};

export const config = {
  matcher: '/((?!_next/image|_next/static|favicon.ico).*)',
};

export default middleware;
