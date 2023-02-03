import { safeJSONParse } from '@zipper/ui';
import { NextRequest, NextResponse } from 'next/server';
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
          originalHeaders: headers,
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
