import { safeJSONParse } from '@zipper/utils';
import YAML from 'yaml';
import { NextRequest, NextResponse } from 'next/server';
import { relayRequest } from '../utils/relay-middleware';
import { getMetaFromHeaders } from '../utils/get-meta-from-headers';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';

export default async function handler(
  request: NextRequest,
  token: string | null,
) {
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
      token,
    });
    headers?.set('Content-Type', 'text/yaml');
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
      JSON.stringify({ ok: false, error: e.toString() }),
      {
        status: 500,
      },
    );
  }
}
