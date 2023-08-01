import { safeJSONParse } from '@zipper/utils';
import YAML from 'yaml';
import { NextRequest, NextResponse } from 'next/server';
import { relayRequest } from '../utils/relay-middleware';
import { getMetaFromHeaders } from '../utils/get-meta-from-headers';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import { setCorsHeaders } from '~/utils/cors';

export default async function handler(request: NextRequest) {
  try {
    // request ends in /api/json or /json
    // anything before that should be treated as filename and/or version

    const { version, filename } = getFilenameAndVersionFromPath(
      request.nextUrl.pathname,
      ['api/yaml'],
    );

    const { result, status, headers } = await relayRequest({
      request,
      version,
      filename,
    });

    if (status !== 200) {
      return new NextResponse(YAML.stringify({ ok: false, error: result }), {
        status,
      });
    }

    headers?.set('Content-Type', 'text/yaml');
    setCorsHeaders(headers);

    return new NextResponse(
      YAML.stringify({
        ok: true,
        data: safeJSONParse(result, undefined, result),
        __meta: getMetaFromHeaders(headers),
      }),
      {
        status,
        headers,
      },
    );
  } catch (e: any) {
    return new NextResponse(
      YAML.stringify({ ok: false, error: e.toString() }),
      {
        status: 500,
      },
    );
  }
}
