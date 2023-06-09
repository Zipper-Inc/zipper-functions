import './zipper.d.ts';
import { files } from './applet/generated/index.gen.ts';
import { BOOT_PATH, ENV_BLOCKLIST, MAIN_PATH } from './lib/constants.ts';
import { ZipperStorage } from './lib/storage.ts';
import { sendLog, methods } from './lib/console.ts';
import { getUserConnectorAuths } from './lib/user-auth-connectors.ts';

import './lib/global-components.ts';

const PORT = 8888;

/**
 * Run the applet with the given RequestEvent
 */
async function runApplet({ request }: Deno.RequestEvent) {
  let body;
  let error;

  // Parse the body
  try {
    body = (await request.json()) as Zipper.Relay.RequestBody;
  } catch (e) {
    error = e;
  }

  // Handle parsing errors
  if (!body || error) {
    const errorString = error ? `\n${error.toString()}` : '';
    return new Response(
      `Zipper Error 400: Missing body ${errorString}`.trim(),
      { status: 400 },
    );
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
  if (new URL(request.url).pathname === `/${BOOT_PATH}`) {
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

    return new Response(JSON.stringify(bootPayload), { status: 200 });
  }

  // Attach ZipperGlobal
  window.Zipper = {
    env,
    storage: new ZipperStorage(appInfo.id),
    Component: {
      create: (component) => ({
        $zipperType: 'Zipper.Component',
        ...component,
      }),
    },
    Action: {
      create: (action) => ({
        $zipperType: 'Zipper.Action',
        ...action,
      }),
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
    JSX: {
      createElement: (tag, props, ...children) => {
        if (typeof tag === 'function') {
          return tag({ ...props, children });
        } else {
          return Zipper.Component.create({
            // deno-lint-ignore no-explicit-any
            type: tag.toLowerCase() as any,
            props,
            children,
          });
        }
      },
      Fragment: (fragment) => fragment,
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
  const path: string = (body.path || MAIN_PATH).replace(/\.(ts|tsx)$|$/, '.ts');
  const { handler } = files[path];

  // Handle missing paths
  if (!handler) {
    return new Response(`Zipper Error 404: Path not found`, { status: 404 });
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

  // Run the handler
  try {
    if (appInfo.connectorsWithUserAuth?.length > 0) {
      await fetchUserAuthConnectorInfo();
    }

    /**
     * A blank slate for a response object
     * Can be written to from inside a handler
     */
    const response: Zipper.HandlerContext['response'] = {};

    const context: Zipper.HandlerContext = {
      userInfo,
      appInfo,
      runId,
      request,
      response,
    };

    const output = await handler(body.inputs, context);

    // Apply response if the response is not overwritten
    if (!response.body) {
      response.body =
        typeof output === 'string' ? output : JSON.stringify(output);
    }

    if (!response.status) {
      response.status = 200;
    }

    return new Response(response.body, response);
  } catch (e) {
    const errorString = e ? `\n${e.toString()}` : '';
    return new Response(
      `Zipper Error 500: Error running handler ${errorString}`.trim(),
      { status: 500 },
    );
  }
}

async function serveHttp(httpConn: Deno.HttpConn) {
  // Each request sent over the HTTP connection will be yielded as an async
  // iterator from the HTTP connection.
  for await (const requestEvent of httpConn) {
    const response = runApplet(requestEvent);
    /**
     * @todo log stuff
     */
    requestEvent.respondWith(response);
  }
}

/**
 * This is the entry point to all applets
 * @see https://deno.com/manual@v1.33.4/examples/http_server
 */
const server = Deno.listen({ port: PORT });
console.log(`Zipper Applet Framework is running at http://localhost:${PORT}`);

/**
 * Handle every connection
 * Right now, we upgrade all connections to HTTP connections
 */
for await (const conn of server) {
  // In order to not be blocking, we need to handle each connection individually
  // without awaiting the function
  serveHttp(Deno.serveHttp(conn));
}
