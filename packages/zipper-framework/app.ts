import { Application } from 'https://deno.land/x/oak@v12.1.0/mod.ts';
import { handlers } from './generated/handlers.gen.ts';
import { ENV_BLOCKLIST, MAIN_PATH } from './constants.ts';
import { ZipperStorage } from './storage.ts';
import { RequestBody } from './types.ts';

const app = new Application();

app.use(async ({ request, response }) => {
  let body;
  let error;

  // Parse the body
  try {
    body = (await request.body({ type: 'json' }).value) as RequestBody;
  } catch (e) {
    error = e;
  }

  // Handle parsing errors
  if (!body || error) {
    response.status = 400;
    response.body = `Zipper Error 400: ${
      error ? error.toString() : 'Missing body'
    }`;
    return;
  }

  // Clean up env object
  const env = Deno.env.toObject();
  ENV_BLOCKLIST.forEach((key) => {
    env[key] = '';
    delete env[key];
  });

  const { appInfo, userInfo, originalRequest } = body;

  // Attach ZipperGlobal
  window.Zipper = {
    env,
    storage: new ZipperStorage(appInfo.id),
    userInfo,
    appInfo,
    originalRequest,
  };

  // Grab the handler
  const path = body.path || MAIN_PATH;
  const handler = handlers[path];

  // Handle missing paths
  if (!handler) {
    response.status = 404;
    response.body = `Zipper Error 404: Path not found`;
  }

  // Run the handler
  try {
    const output = await handler(body.inputs);
    response.status = 200;
    response.body = output;
  } catch (e) {
    response.status = 500;
    response.body = `Zipper Error 500: ${
      e.toString() || 'Internal server error'
    }`;
  }

  // TODO
  // - Headers
  // -
});

await app.listen({ port: 8888 });
