import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { hasZipperEszipHeader } from '~/utils/eszip-utils';
import { hasBrowserLikeUserAgent } from '~/utils/user-agent';

const parseZipperSrcPath = (req: NextRequest) => {
  const matches = req.nextUrl.pathname.match(
    /^\/([^\s]*)\/([^\s]*)\/src\/([^\s]*.tsx?)$/,
  );
  if (!matches) return false;
  const [, resourceOwnerSlug = '', appSlug = '', filename = ''] = matches;
  return { resourceOwnerSlug, appSlug, filename };
};

export default async (req: NextRequest) => {
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

  const requestHeaders = new Headers(req.headers);

  // Setting request headers
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set(
    'Content-Security-Policy',
    // Replace newline characters and spaces
    cspHeader.replace(/\s{2,}/g, ' ').trim(),
  );

  if (process.env.__DEBUG__) {
    console.log('middleware', {
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      nextUrl: req.nextUrl,
    });
  }

  const zipperSrcParams = parseZipperSrcPath(req);
  if (
    zipperSrcParams &&
    (!hasBrowserLikeUserAgent(req) || hasZipperEszipHeader(req))
  ) {
    const { appSlug, filename } = zipperSrcParams;
    const url = new URL(`/api/src/${appSlug}/latest/${filename}`, req.url);
    return NextResponse.rewrite(url);
  }

  const res = NextResponse.next({
    headers: requestHeaders,
    request: {
      headers: requestHeaders,
    },
  });

  if (!req.cookies.get(ZIPPER_TEMP_USER_ID_COOKIE_NAME)) {
    res.cookies.set(
      ZIPPER_TEMP_USER_ID_COOKIE_NAME,
      `temp__${crypto.randomUUID()}`,
    );
  }

  return res;
};

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
