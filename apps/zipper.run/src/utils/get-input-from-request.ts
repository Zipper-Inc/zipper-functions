import { safeJSONParse } from '@zipper/utils';
import { NextRequest } from 'next/server';

export default async function getInputFromRequest(
  request: NextRequest,
  body?: string,
) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams.entries());
  } else if (body) {
    return safeJSONParse(body);
  } else if (request.body && !request.bodyUsed) {
    return await request.json();
  } else {
    return {};
  }
}
