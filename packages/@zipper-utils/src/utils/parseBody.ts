export async function parseBody(
  request: Request,
): Promise<Record<string, any>> {
  const header = request.headers.get('Content-Type');
  switch (true) {
    case header === 'application/x-www-form-urlencoded':
      return Object.fromEntries(
        new URLSearchParams(await request.text()).entries(),
      );
    case header === 'application/json':
      return JSON.parse((await request.text()) || '{}');
    case header?.startsWith('multipart/form-data'):
      return Object.fromEntries(await request.formData());
    default:
      return {};
  }
}