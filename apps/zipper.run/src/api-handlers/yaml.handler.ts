import { safeJSONParse } from '@zipper/utils';
import YAML from 'json-to-pretty-yaml';
import { NextRequest, NextResponse } from 'next/server';
import { relayRequest } from '../utils/relay-middleware';

export default async function handler(request: NextRequest) {
  try {
    const { result, status, headers } = await relayRequest(request);
    headers?.set('Content-Type', 'text/yaml');
    return new NextResponse(
      YAML.stringify({
        ok: true,
        data: safeJSONParse(result, undefined, result),
        originalHeaders: headers,
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
