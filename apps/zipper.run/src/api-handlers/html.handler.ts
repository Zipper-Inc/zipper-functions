import { NextRequest, NextResponse } from 'next/server';
import { getParsedPath } from '~/utils/get-parsed-path';
import { relayRequest } from '~/utils/relay-middleware';
import { setCorsHeaders } from '~/utils/cors';

export default async function htmlHandler(request: NextRequest) {
  const { version, filename } = getParsedPath(request.nextUrl.pathname);

  const { result, status, headers } = await relayRequest({
    request,
    version,
    filename,
  });

  const mutableHeaders = new Headers(headers);

  mutableHeaders?.set('Content-Type', 'text/html');
  setCorsHeaders(mutableHeaders);

  if (status === 404) {
    return NextResponse.rewrite(new URL('/404', request.url));
  }

  if (status >= 500) {
    return new NextResponse(`Error: ${result}`, {
      status,
      headers,
    });
  }

  return new NextResponse(result, {
    status,
    headers: mutableHeaders,
  });
}
