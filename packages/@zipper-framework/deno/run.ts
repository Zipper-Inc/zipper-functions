/// <reference lib="deno.ns" />

import './zipper.d.ts';
import { files } from './applet/generated/index.gen.ts';
import bootInfoCached from './applet/generated/boot-info.gen.ts';
import { BOOT_PATH, ENV_BLOCKLIST, MAIN_PATH } from './lib/constants.ts';
import { ZipperStorage } from './lib/storage.ts';
import { sendLog, methods } from './lib/console.ts';

import './lib/global-components.ts';

const PORT = 8888;

/**
 * Run the applet with the given RequestEvent
 */
async function runApplet({ request: relayRequest }: Deno.RequestEvent) {
  const deploymentId = relayRequest.headers.get('x-zipper-deployment-id');
  const slug = relayRequest.headers.get('x-zipper-subdomain') as string;
  let [appId, version] = deploymentId?.split('@') as [string, string];

  // Handle booting seperately
  // This way, we can deploy without running Applet code
  if (new URL(relayRequest.url).pathname === `/${BOOT_PATH}`) {
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
      appId,
      deploymentId: deploymentId || `${appId}@${version}`,
      configs,
      bootInfo: bootInfoCached,
    };

    return new Response(JSON.stringify(bootPayload), { status: 200 });
  }

  let body;
  let error;

  // Parse the body
  try {
    body = (await relayRequest.json()) as Zipper.Relay.RequestBody;
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

  appId = body.appInfo.id || appId;
  version = body.appInfo.version || version;

  // Clean up env object
  const env = Deno.env.toObject();
  ENV_BLOCKLIST.forEach((key) => {
    env[key] = '';
    delete env[key];
  });

  const { userInfo, runId, userConnectorTokens, originalRequest } = body;

  // Attach ZipperGlobal
  window.Zipper = {
    env,
    storage: new ZipperStorage(appId),
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
            type: `html.${tag}` as Zipper.HtmlElement['type'],
            props,
            children,
          });
        }
      },
      Fragment: ({ children }) => children,
    },
  };

  // Take over console.* methods
  methods.forEach((method) => {
    const originalMethod = console[method] as (...data: unknown[]) => void;
    console[method] = (...data) => {
      originalMethod(...data);
      sendLog({
        appId,
        version,
        runId,
        log: {
          id: crypto.randomUUID(),
          method,
          timestamp: new Date(),
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

  // Run the handler
  try {
    /**
     * A blank slate for a response object
     * Can be written to from inside a handler
     */
    const response: Zipper.HandlerContext['response'] = {};

    const stash: Zipper.HandlerContext['stash'] = {
      get: (key) => stash[key],
      set: (key, value) => (stash[key] = value),
    };
    const context: Zipper.HandlerContext = {
      userInfo,
      appInfo: body.appInfo,
      runId,
      request: originalRequest,
      response,
      userConnectorTokens,
      relayRequest,
      stash,
    };

    const inputs = JSON.parse(JSON.stringify(body.inputs), (key, value) => {
      let a;
      if (typeof value === 'string') {
        a = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)$/.exec(value);
        if (a && a[1]) {
          return new Date(a[1]);
        }
      }
      return value;
    });

    const output = await handler(inputs, context);

    if (output instanceof Response) return output;

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
