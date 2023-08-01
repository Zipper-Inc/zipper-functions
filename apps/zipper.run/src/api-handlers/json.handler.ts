import { safeJSONParse } from '@zipper/utils';
import { NextRequest, NextResponse } from 'next/server';
import { setCorsHeaders } from '~/utils/cors';
import { getMetaFromHeaders } from '~/utils/get-meta-from-headers';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import { relayRequest } from '../utils/relay-middleware';

export default async function handler(request: NextRequest) {
  try {
    // request ends in /api/json or /json
    // anything before that should be treated as filename and/or version

    const { version, filename } = getFilenameAndVersionFromPath(
      request.nextUrl.pathname,
      ['api/json', 'api'],
    );

    const { result, status, headers } = await relayRequest({
      request,
      version,
      filename,
    });

    if (status !== 200) {
      return new NextResponse(JSON.stringify({ ok: false, error: result }), {
        status,
      });
    }

    headers?.set('Content-Type', 'application/json');
    setCorsHeaders(headers);

    return new NextResponse(
      JSON.stringify(
        {
          ok: true,
          data: safeJSONParse(result, undefined, result),
          __meta: getMetaFromHeaders(headers),
        },
        null,
        2,
      ),
      {
        status,
        headers,
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
