import { Request } from 'https://deno.land/x/oak@v12.1.0/mod.ts';

export async function parseBody(request: Request) {
  try {
    const body = await request.body({ type: 'json' }).value;
    if (!body) throw new Error();
    return body;
  } catch (_e) {
    return { error: 'Body is not valid JSON' };
  }
}
