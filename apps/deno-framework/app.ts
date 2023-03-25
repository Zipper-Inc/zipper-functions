import { Application } from 'https://deno.land/x/oak@v12.1.0/mod.ts';
import { parseBody } from './utils.ts';
import { MAIN_PATH } from './constants.ts';
import { Storage } from './storage.ts';

declare global {
  interface Window {
    Zipper: {
      env: Deno.Env;
      storage: Storage;
    };
  }
}

const app = new Application();

app.use(async ({ request, response }) => {
  const body = await parseBody(request);

  if (body.error) {
    response.status = 500;
    response.body = `500 Zipper Error: ${body.error}`;
    return;
  }

  window.Zipper = { env: Deno.env, storage: new Storage() };

  // Handle main.ts
  if (!body.path || body.path === MAIN_PATH) {
    const { main } = await import(`./src/${MAIN_PATH}`);
    response.body = await main(body.inputs);
  } else {
    // Handle all other paths
    try {
      const { handler } = await import(`./src/${body.path}`);
      response.body = await handler(body.inputs);
    } catch (_e) {
      response.status = 404;
      response.body = `404 Zipper Error: Path not found`;
    }
  }
});

await app.listen({ port: 8888 });
