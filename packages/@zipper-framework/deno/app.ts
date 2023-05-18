import './zipper.d.ts';
import { Application } from 'https://deno.land/x/oak@v12.1.0/mod.ts';
import { files } from './generated/index.gen.ts';
import { BOOT_PATH, ENV_BLOCKLIST, MAIN_PATH } from './constants.ts';
import { ZipperStorage } from './storage.ts';
import { sendLog, methods } from './console.ts';
import { getUserConnectorAuths } from './userAuthConnectors.ts';

const app = new Application();

app.use(async ({ request, response }) => {
  let body;
  let error;

  // Parse the body
  try {
    body = (await request.body({ type: 'json' })
      .value) as Zipper.Relay.RequestBody;
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

  const { appInfo, userInfo, runId, userId } = body;

  // Handle booting seperately
  // This way, we can deploy without running Applet code
  if (request.url.pathname === `/${BOOT_PATH}`) {
    const { id, slug, version } = appInfo;

    const configs = Object.entries(files).reduce(
      (map, [path, { config }]) =>
        config
          ? {
              ...map,
              [path]: config,
            }
          : map,
      {},
    );

    const bootPayload: Zipper.BootPayload = {
      ok: true,
      slug,
      version,
      appId: id,
      deploymentId: `${id}@${version}`,
      configs,
    };

    response.status = 200;
    response.body = JSON.stringify(bootPayload);
    return;
  }

  // Attach ZipperGlobal
  window.Zipper = {
    env,
    storage: new ZipperStorage(appInfo.id),
    Action: {
      create: (action) =>
        ({
          $zipperType: 'Zipper.Action',
          ...action,
          // deno-lint-ignore no-explicit-any
        } as any),
    },
    Router: {
      redirect: (url) => ({
        $zipperType: 'Zipper.Router',
        redirect: url.toString(),
      }),
      notFound: () => ({
        $zipperType: 'Zipper.Router',
        notFound: true,
      }),
      error: (...data) => ({
        $zipperType: 'Zipper.Router',
        error: data
          .map((v) =>
            !v || (typeof v === 'object' && !(v instanceof Error))
              ? JSON.stringify(v)
              : v.toString(),
          )
          .join(' '),
      }),
    },
  };

  // Take over console.* methods
  methods.forEach((method) => {
    const originalMethod = console[method] as (...data: unknown[]) => void;
    console[method] = (...data) => {
      originalMethod(...data);
      sendLog({
        appId: appInfo.id,
        version: appInfo.version,
        runId,
        log: {
          id: crypto.randomUUID(),
          method,
          timestamp: Date.now(),
          data,
        },
      });
    };
  });

  // Grab the handler
  let path: string = body.path || MAIN_PATH;
  if (!path.endsWith('.ts')) path = `${path}.ts`;
  const { handler } = files[path];

  // Handle missing paths
  if (!handler) {
    response.status = 404;
    response.body = `Zipper Error 404: Path not found`;
    return;
  }

  const fetchUserAuthConnectorInfo = async () => {
    const authInfo = await getUserConnectorAuths(appInfo.id, userId);
    if (authInfo.missingConnectorAuths.length > 0) {
      const missingAuths = authInfo.missingConnectorAuths.join(', ');
      throw new Error(`Missing the following connector auths: ${missingAuths}`);
    }
    if (Object.keys(authInfo.authTokens).length > 0) {
      Object.keys(authInfo.authTokens).forEach((key) => {
        env[key] = authInfo.authTokens[key];
      });
    }
  };

  const context: Zipper.HandlerContext = {
    userInfo,
    appInfo,
    runId,
    request,
    response,
  };

  // Run the handler
  try {
    if (appInfo.connectorsWithUserAuth.length > 0) {
      await fetchUserAuthConnectorInfo();
    }

    const output = await handler(body.inputs, context);
    response.status = 200;
    response.body = output || '';
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
