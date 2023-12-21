import { safeJSONParse } from '@zipper/utils';
import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '~/utils/cors';
import { getMetaFromHeaders } from '~/utils/get-meta-from-headers';
import { getParsedPath } from '~/utils/get-parsed-path';
import { relayRequest } from '../utils/relay-middleware';

export default async function handler(request: NextRequest) {
  try {
    // request ends in /api/json or /json
    // anything before that should be treated as filename and/or version

    const { version, filename } = getParsedPath(request.nextUrl.pathname);

    const { result, status, headers } = await relayRequest({
      request,
      version,
      filename,
    });

    const mutableHeaders = new Headers(headers);

    if (status !== 200) {
      return new NextResponse(JSON.stringify({ ok: false, error: result }), {
        status,
      });
    }

    mutableHeaders?.set('Content-Type', 'application/json');
    setCorsHeaders(mutableHeaders);

    return new NextResponse(
      JSON.stringify(
        {
          ok: true,
          data: safeJSONParse(result, undefined, result),
          __meta: getMetaFromHeaders(mutableHeaders),
        },
        null,
        2,
      ),
      {
        status,
        headers: mutableHeaders,
      },
    );
  } catch (e: any) {
    return new NextResponse(
      JSON.stringify({ ok: false, error: e.toString() }),
      {
        status: 500,
      },
    );
  }
}
