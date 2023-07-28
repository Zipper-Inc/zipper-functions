export async function parseBody(
  request: Request,
): Promise<Record<string, any>> {
  return request.headers.get('Content-Type') ===
    'application/x-www-form-urlencoded'
    ? Object.fromEntries(new URLSearchParams(await request.text()).entries())
    : JSON.parse((await request.text()) || '{}');
}
