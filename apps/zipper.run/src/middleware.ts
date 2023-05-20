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
  headers: Headers,
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
      return serveRelay({
        request,
        bootOnly: false,
      });
    }

    case /\/boot(\/?)$/.test(appRoute): {
      console.log('matching boot route (it rhymes)');
      return serveRelay({
        request,
        bootOnly: true,
      });
    }

    case /^\/$/.test(appRoute): {
      if (request.method === 'GET') {
        const url = new URL('/main.ts', request.url);
        return NextResponse.rewrite(url, { request: { headers } });
      }
      if (request.method === 'POST') {
        const url = new URL('/relay', request.url);
        return NextResponse.rewrite(url, { request: { headers } });
      }
    }
  }
}

const checkAuthCookies = async (request: NextRequest) => {
  const zipperAccessToken = request.cookies.get('__zipper_token')?.value;
  let userId: string | undefined = undefined;
  if (zipperAccessToken) {
    try {
      const { payload } = await jwtVerify(
        zipperAccessToken,
        new TextEncoder().encode(process.env.JWT_SIGNING_SECRET!),
      );
      userId = payload.sub;
    } catch (e) {
      const refreshToken = request.cookies.get('__zipper_refresh')?.value;

      if (refreshToken) {
        const { payload } = await jwtVerify(
          refreshToken,
          new TextEncoder().encode(process.env.JWT_REFRESH_SIGNING_SECRET!),
        );
        userId = payload.sub;
        try {
          const result = await fetch(
            `${process.env.NEXT_PUBLIC_ZIPPER_API_URL}/auth/refreshToken`,
            {
              method: 'POST',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refreshToken,
              }),
            },
          );
          if (result.status === 200) {
            const json = await result.json();
            return { userId, accessToken: json.accessToken };
          } else {
            return { userId, accessToken: undefined };
          }
        } catch (e) {
          console.log(e);
          return { userId, accessToken: undefined };
        }
      }
    }
  }
  return { userId, accessToken: zipperAccessToken };
};

export const middleware = async (request: NextRequest) => {
  const appRoute = request.nextUrl.pathname;
  if (__DEBUG__) console.log('middleware', { appRoute });

  const { userId, accessToken } = await checkAuthCookies(request);
  const requestHeaders = new Headers(request.headers);
  if (accessToken) requestHeaders.set('x-zipper-access-token', accessToken);
  const customResponse = await maybeGetCustomResponse(
    appRoute,
    request,
    requestHeaders,
  );
  const response =
    customResponse ||
    NextResponse.next({ request: { headers: requestHeaders } });

  if (accessToken) {
    response.cookies.set({
      name: '__zipper_token',
      value: accessToken,
      path: '/',
    });
  }

  if (!userId && !request.cookies.get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)) {
    const tempId = `temp__${crypto.randomUUID()}`;
    response.cookies.set(ZIPPER_TEMP_USER_ID_COOKIE_NAME, tempId);
  }

  return response;
};

export const config = {
  matcher: '/((?!_next/image|_next/static|favicon.ico|auth).*)',
};

export default middleware;
