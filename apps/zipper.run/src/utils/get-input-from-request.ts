import { NextRequest } from 'next/server';

export default async function getInputFromRequest(
  request: NextRequest,
  body?: string,
) {
  if (request.method === 'GET') {
    const url = new URL(request.url);
    return Object.fromEntries(url.searchParams.entries());
  } else if (request.body || body) {
    return body || request.json();
  } else {
    return {};
  }
}
