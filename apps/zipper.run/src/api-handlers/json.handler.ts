import { safeJSONParse } from '@zipper/utils';
import { NextRequest, NextResponse } from 'next/server';
import { getMetaFromHeaders } from '~/utils/get-meta-from-headers';
import { relayRequest } from '../utils/relay-middleware';

export default async function handler(request: NextRequest) {
  try {
    const { result, status, headers } = await relayRequest(request);
    headers?.set('Content-Type', 'application/json');
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
