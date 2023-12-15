// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import serveRelay from './utils/relay-middleware';
import jsonHandler from './api-handlers/json.handler';
import yamlHandler from './api-handlers/yaml.handler';
import htmlHandler from './api-handlers/html.handler';

import {
  getZipperApiUrl,
  hasBrowserLikeUserAgent,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import { jwtVerify } from 'jose';
import getValidSubdomain from './utils/get-valid-subdomain';

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
    case /^\/src(\/?)/.test(appRoute): {
      console.log('matching src route');
      return serveSource({ request });
    }

    case /\/api(\/?)$/.test(appRoute):
    case /\/api\/json(\/?)$/.test(appRoute): {
      console.log('matching json api route');
      return jsonHandler(request);
    }

    case /\/api\/yaml(\/?)$/.test(appRoute): {
      console.log('matching yaml api route');
      return await yamlHandler(request);
    }

    case /\/api\/html(\/?)$/.test(appRoute): {
      console.log('matching html api route');
      return await htmlHandler(request);
    }

    case /\/raw(\/?)$/.test(appRoute):
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

    case /^\/run\/zendesk(\/?)/.test(appRoute): {
      // grab the filename so we can pass it on to the embed route,
      // default to main.ts
      const pathRemainder =
        appRoute.match(/^\/run\/zendesk\/(.*)/)?.[1] || 'main.ts';
      const url = new URL(`/run/embed/${pathRemainder}`, request.url);
      // When zendesk signs it's urls it requests the initial page of the
      // iframe with a POST. The JWT will be in the formData.
      // Unsigned zendesk apps request the initial page with a GET.
      if (request.method === 'POST') {
        const body = Object.fromEntries(await request.formData());
        const params = new URLSearchParams(body as Record<string, string>);
        params.forEach((value, key) => {
          url.searchParams.append(key, value);
        });
      }

      return NextResponse.rewrite(url, {
        request: { headers },
      });
    }

    case /^\/$/.test(appRoute): {
      if (request.method === 'GET') {
        const url = new URL('/main.ts', request.url);
        return NextResponse.rewrite(url, { request: { headers } });
      }
    }

    default: {
      if (!hasBrowserLikeUserAgent(request.headers)) {
        console.log('not a browser so returning the relay');
        return serveRelay({
          request,
          bootOnly: false,
        });
      }
    }
  }
}

export async function serveSource({ request }: { request: NextRequest }) {
  const path = request.nextUrl.pathname;
  let newPath = path;

  if (path.startsWith('/src')) {
    newPath = path.replace('src', '');
  }

  let filename: string | undefined;
  let version: string | undefined;

  const parts = newPath.split('/').filter((s) => s.length !== 0);

  // for each part, check if it's a version (based on @) otherwise assume it's a filename
  // if there are multiple parts, the last part is the filename
  parts.forEach((part) => {
    if (part[0] === '@') version = part.slice(1);
    else filename = part;
  });

  if (filename && !filename.endsWith('.ts') && !filename.endsWith('.tsx'))
    filename = `${filename}.ts`;

  const host =
    request.headers.get('x-zipper-host') || request.headers.get('host') || '';
  const subdomain = getValidSubdomain(host);

  if (!filename) {
    return new NextResponse('Filename missing', { status: 404 });
  }

  const srcAPIUrl = `${getZipperApiUrl()}/src/${subdomain}/${
    version || 'latest'
  }/${filename}`;

  const response = await fetch(srcAPIUrl);

  if (response.status === 200) {
    const result = await response.text();
    return new NextResponse(result, { headers: response.headers });
  } else {
    return new NextResponse(response.statusText, { status: 404 });
  }
}

const generateHMAC = async (input: string) => {
  const encoder = new TextEncoder();
  const timestamp = Date.now().toString();
  const data = encoder.encode(
    `POST__/api/auth/refreshToken__${input}__${timestamp}`,
  );

  const importedKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(process.env.HMAC_SIGNING_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const buffer = await crypto.subtle.sign('HMAC', importedKey, data);

  const digestArray = Array.from(new Uint8Array(buffer));
  const digestHex = digestArray
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  return { hmac: digestHex, timestamp };
};

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
        try {
          const { payload } = await jwtVerify(
            refreshToken,
            new TextEncoder().encode(process.env.JWT_REFRESH_SIGNING_SECRET!),
          );
          userId = payload.sub;
          const body = JSON.stringify({
            refreshToken,
          });
          const { hmac, timestamp } = await generateHMAC(body);
          const result = await fetch(`${getZipperApiUrl()}/auth/refreshToken`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
              'x-timestamp': timestamp,
              'x-zipper-hmac': hmac,
            },
            body,
          });
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
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

  const appRoute = request.nextUrl.pathname;
  if (__DEBUG__)
    console.log('middleware', {
      appRoute,
      url: request.url,
      nextUrl: request.nextUrl,
      headers: Object.fromEntries(request.headers.entries()),
    });

  const { userId, accessToken } = await checkAuthCookies(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    // Replace newline characters and spaces
    cspHeader.replace(/\s{2,}/g, ' ').trim(),
  );
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
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  } else {
    response.cookies.set('__zipper_token', '', {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
    response.cookies.set('__zipper_refresh', '', {
      expires: new Date(Date.now()),
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
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
