import { NextRequest, NextResponse } from 'next/server';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import { relayRequest } from '~/utils/relay-middleware';

export default async function htmlHandler(request: NextRequest) {
  const { version, filename } = getFilenameAndVersionFromPath(
    request.nextUrl.pathname,
    ['api/html'],
  );

  const { result, status, headers } = await relayRequest({
    request,
    version,
    filename,
  });

  headers?.set('Content-Type', 'text/html');

  headers?.set('Access-Control-Allow-Origin', '*');
  headers?.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS',
  );
  headers?.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    headers,
  });
}
