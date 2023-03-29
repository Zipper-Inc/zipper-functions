import fs from 'fs/promises';
import { NextApiRequest, NextApiResponse } from 'next';
import * as jose from 'jose';
import * as eszip from '@deno/eszip';
import pako from 'pako';
import { PassThrough } from 'stream';
import ndjson from 'ndjson';
import intoStream from 'into-stream';
import { decryptFromBase64 } from '@zipper/utils';
import { prisma } from '~/server/prisma';
import { App, Script } from '@prisma/client';
import path from 'path';
import { getAppLink } from '@zipper/utils';

const X_DENO_CONFIG = 'x-deno-config';

const DEFAULT_CONTENT_TYPE = 'application/octet-stream';

/**
 * @todo
 * Bundle this up or put this source somewhere else
 * Totally possible that the directory structure cannot be guaranteed
 */
const FRAMEWORK_PATH = path.resolve('../deno-framework');
const FRAMEWORK_ENTRYPOINT = 'app.ts';
const HANDLERS_PATH = 'generated/handlers.gen.ts';
const TYPESCRIPT_CONTENT_HEADERS = {
  'content-type': 'text/typescript',
};

/**
 * Assuming the user has defined a function called `main`
 * This wrapper injects some code that:
 *  - gets inputs from the request
 *  - calls the user's main function
 *  - handles standardizing output and errors
 */
export const _wrapMainFunction = ({
  code,
  slug,
  appId,
  version = Date.now().toString(),
}: {
  code: string;
  slug: string;
  appId: string;
  version: string;
}) => `
${code}

/*****************************************************************/

import { hmac as __zipper_hmac } from "https://deno.land/x/hmac@v2.0.1/mod.ts";

const __generateHmac = (
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body: Record<string, unknown> = {},
  ) => {
    const timestamp = Date.now().toString();

    return {
      hmac: __zipper_hmac(
        "sha256",
        "${process.env.HMAC_SIGNING_SECRET}",
        method + '__' + path + '__' + JSON.stringify(body) + '__' + timestamp,
        "utf8",
        "hex"
      ),
      timestamp,
    }
  }

const __storage = {
  get: async (key?: string) => {
    let path = '/api/app/${appId}/storage';
    if (key) path += '?key=' + key;
    const {hmac, timestamp} = __generateHmac('GET', path);

    const res = await fetch('${
      process.env.RPC_HOST
    }' + path, { headers: {'x-zipper-hmac': hmac, 'x-timestamp': timestamp} } );

    const result = await res.json();
    return key ? result.value : result;
  },
  set: async (key: string, value: unknown) => {
    let path = '/api/app/${appId}/storage';
    const {hmac, timestamp} = __generateHmac('POST', path, {key, value});

    const res = await fetch('${process.env.RPC_HOST}' + path, {
      headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });

    return res.json();
  },
  delete: async (key: string) => {
    let path = '/api/app/${appId}/storage?key=' + key;
    const {hmac, timestamp} = __generateHmac('DELETE', path);

    const res = await fetch('${process.env.RPC_HOST}' + path, {
      headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
      method: 'DELETE',
    });

    return res.json();
  },
}

/**
 * Makes sure JSON objects are not too big for headers
 * Headers should be capped under 8000 bytes
 */
const jsonHeader = (json, fallback = "JSON too big") => {
  try {
    const str = JSON.stringify(json);
    if (str.length < 2000) return str;
  } catch (e) {}
  return fallback;
}

const Zipper = {
  env: Deno.env,
  storage: __storage,
  appInfo: {
    id: '${appId}',
    slug: '${slug}',
    version: '${version}',
    url: 'https://${getAppLink(slug)}',
  },
  userInfo: {}
};

let fn: Function | undefined = undefined;
if(typeof main === 'function') fn = main;
if(!fn && typeof handler === 'function') fn = handler;

if(typeof fn === 'function') {
  addEventListener('fetch', async (event) => {
    const body = event.request.body ? await event.request.json() : {};
    Zipper.userInfo = body.userInfo;

    const xZipperHeaders = {
      'X-Zipper-Deployment-Id': '${appId}@${version}',
      'X-Zipper-App-Slug': '${slug}',
      'X-Zipper-Req-Url': event.request.url,
      'X-Zipper-Req-Method': event.request.method,
      'X-Zipper-App-Run-Input': jsonHeader(body.inputs, "See original request body"),
    };

    try {
      const output = await fn(body.inputs);

      if (output instanceof Response) {
        if (!output.headers.get('Content-Type'))
          output.headers.set('Content-Type', '${DEFAULT_CONTENT_TYPE}')
        Object.keys(xZipperHeaders).forEach((h) => {
          output.headers.set(h, xZipperHeaders[h]);
        });
        event.respondWith(output);
      } else if (typeof output === 'function') {
        throw new Error('Function output cannot be a function.');
      } else {
        const isObject = typeof output === 'object';
        event.respondWith(
          new Response(isObject ? JSON.stringify(output) : output, {
            status: 200,
            headers: {
              ...xZipperHeaders,
              ${/** @todo maybe better inference here, yolo */ ''}
              'Content-Type': isObject ? 'application/json' : 'text/plain',
            },
          }),
        );
      }
    } catch(error) {
      const response = {
        ok: false,
        error,
      };

      console.error(error);

      event.respondWith(
        new Response(JSON.stringify(response), {
          status: 500,
        }),
      );
    }
  });
};
`;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!req.url) return new Response('No URL', { status: 400 });

  const url = new URL(
    req.url,
    `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${
      req.headers.host
    }`,
  );
  // Take RPC args from query string
  const args = Object.fromEntries(url.searchParams.entries());

  // Validate JWT
  const payload = await decodeAuthHeader(req);
  // Sanity check JWT deploymentId matches the one provided via args
  if (args.deployment_id && payload.deployment_id !== args.deployment_id) {
    throw new Error(
      `DeploymentID mismatch (JWT != QS): '${payload.deployment_id}' != ${args.deployment_id}`,
    );
  }
  // Dispatch RPCs
  console.log('Handling RPC: ', url.pathname);

  switch (url.pathname) {
    case '/api/deno/v0/boot': {
      if (!args.deployment_id) throw new Error('Missing deployment_id');

      const { body, headers }: any = await originBoot({
        req,
        id: args.deployment_id || '',
      });
      if (headers) {
        Object.keys(headers as any).forEach((key) => {
          res.setHeader(key, headers[key] || '');
        });
      }
      const readStream = new PassThrough();
      readStream.end(body);
      readStream.pipe(res);
      break;
    }
    case '/api/deno/v0/events': {
      res.status(200).send('OK');
      let bufferChunks: any[] = [];
      req.on('data', async (data) => {
        bufferChunks.push(data);
      });
      req.on('end', async () => {
        const buffer = Buffer.concat(bufferChunks);
        bufferChunks = [];
        const message = pako.ungzip(buffer, { to: 'string' });
        intoStream(message)
          .pipe(ndjson.parse())
          .on('data', async (event) => {
            console.log(event);
            await prisma.appEvent.create({
              data: {
                deploymentId: event.deployment_id,
                eventPayload: event.event,
                eventType: event.event_type,
                timestamp: event.timestamp,
              },
            });
          });
      });

      break;
    }
    case '/api/deno/v0/read_blob': {
      if (!args.deployment_id) throw new Error('Missing deployment_id');
      return originReadBlob(args.deployment_id, args.hash);
    }
    case 'api/deno/v0/read_tree': {
      if (!args.deployment_id) throw new Error('Missing deployment_id');
      return originReadTree(args.deployment_id);
    }
  }
  return new Response(`¯\\_(ツ)_/¯`, { status: 500 });
}

async function decodeAuthHeader(req: NextApiRequest) {
  const authHeader = req.headers?.authorization;
  if (!authHeader) {
    throw new Error('Missing authorization header');
  }
  const [bearer, token] = authHeader.split(' ');
  if (bearer !== 'Bearer') {
    throw new Error(`Auth header is not 'Bearer {token}'`);
  }

  if (!token) {
    throw new Error(`No token provided`);
  }

  const encoder = new TextEncoder();
  const secretKey = encoder.encode(process.env.SHARED_SECRET);
  try {
    const verified = await jose.jwtVerify(token, secretKey);
    return verified.payload;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

const build = async ({
  baseUrl,
  app,
  version,
}: {
  baseUrl: string;
  app: App & { scripts: Script[] };
  version: string;
}) => {
  const startMs = performance.now();
  const appName = `${app.name}@${version}`;

  console.log('[ESZIP]', `Building ${appName} for deployment`);

  const appFilesBaseUrl = `${baseUrl}/src`;
  const frameworkEntrypointUrl = `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`;
  const appFileUrls = app.scripts.map(
    ({ filename }) => `${appFilesBaseUrl}/${filename}`,
  );
  const fileUrlsToBundle = [frameworkEntrypointUrl, ...appFileUrls];

  const bundle = await eszip.build(fileUrlsToBundle, async (specifier) => {
    /**
     * Generate a handler map
     */
    // todo

    /**
     * Handle user's App files
     */
    if (specifier.startsWith(appFilesBaseUrl)) {
      const filename = specifier.replace(`${appFilesBaseUrl}/`, '');
      const script = app.scripts.find((s) => s.filename === filename);

      console.log('[ESZIP]', `>`, `Adding ${filename} from ${appName}`);

      return {
        specifier,
        headers: TYPESCRIPT_CONTENT_HEADERS,
        content: script?.code || '/* missing code */',
        kind: 'module',
        version,
      };
    }

    /**
     * Handle Zipper Framework Files
     */
    if (specifier.startsWith(baseUrl)) {
      const filename = specifier.replace(`${baseUrl}/`, '');

      console.log('[ESZIP]', '>', `Adding ${filename} from framework`);
      const isHandlersPath = filename === HANDLERS_PATH;
      if (isHandlersPath) {
        console.log('[ESZIP]', '>', '>', 'Generating new routes');
      }

      const content = await fs.readFile(
        path.resolve(FRAMEWORK_PATH, filename),
        'utf8',
      );

      if (isHandlersPath) {
        // Filter out main since it's already included
        const filenames = app.scripts
          .map((s) => s.filename)
          .filter((f) => f !== 'main.ts');

        const generatedImports = [
          '/// <generated-imports>',
          ...filenames.map((f, i) => `import * as m${i} from '../src/${f}';`),
          '/// </generated-imports>',
        ].join(`\n`);

        const generatedExports = [
          '/// <generated-exports>',
          ...filenames.map((f, i) => `'${f}': m${i}.handler as Handler,`),
          '/// </generated-exports>',
        ].join('\n');

        const importsRegExp = new RegExp(
          '/// <generated-imports[\\d\\D]*?/generated-imports>',
          'g',
        );
        const exportsRegExp = new RegExp(
          '/// <generated-exports[\\d\\D]*?/generated-exports>',
          'g',
        );

        return {
          kind: 'module',
          specifier,
          headers: TYPESCRIPT_CONTENT_HEADERS,
          content: content
            .replace(importsRegExp, generatedImports)
            .replace(exportsRegExp, generatedExports),
        };
      }

      return {
        kind: 'module',
        specifier,
        headers: TYPESCRIPT_CONTENT_HEADERS,
        content,
      };
    }

    /**
     * Handle remote imports
     */
    console.log('[ESZIP]', `>`, `Adding ${specifier} from remote`);

    const response = await fetch(specifier, { redirect: 'follow' });
    if (response.status !== 200) {
      // ensure the body is read as to not leak resources
      await response.arrayBuffer();
      return undefined;
    }

    const content = await response.text();
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });

    return {
      kind: 'module',
      specifier: response.url,
      headers,
      content,
    };
  });

  const elapsedMs = performance.now() - startMs;
  console.log(
    '[ESZIP]',
    `Built ${app.name}@${version} in ${Math.round(elapsedMs)}ms`,
  );

  return bundle;
};

function errorResponse(errorMessage: string) {
  return {
    body: `addEventListener("fetch", (e) => e.respondWith(new Response("${errorMessage}")));`,
    headers: {
      [X_DENO_CONFIG]: JSON.stringify({
        entrypoint: 'file:///src/main.js',
        layers: [
          {
            kind: 'bundle',
            id: '812a2873-7aa8-46a0-9b97-bbace05de91d',
            specifier: 'file:///src/main.js',
          },
        ],
        inline_layer: '812a2873-7aa8-46a0-9b97-bbace05de91d',
      }),
      status: 200,
    },
  };
}

/** @todo use a real deployment id instead of an app id. deployment id should be app id and version or something */
async function originBoot({
  req,
  id: deploymentId,
}: {
  req: NextApiRequest;
  id: string;
}) {
  const [appId, version, userId] = deploymentId.split('@');

  if (!appId || !version) {
    console.error('Missing appId and version');
    return;
  }

  const app = await prisma.app.findFirst({
    where: {
      id: appId,
    },
    include: {
      scripts: true,
      scriptMain: true,
      secrets: true,
      connectors: {
        include: {
          appConnectorUserAuths: { where: { userIdOrTempId: userId } },
        },
      },
    },
  });

  if (!app) {
    return errorResponse(`Missing app ID`);
  }

  const missingUserAuths = app.connectors.filter((connector) => {
    if (
      connector.isUserAuthRequired &&
      connector.appConnectorUserAuths.length === 0
    ) {
      return true;
    }
  });

  if (missingUserAuths.length > 0) {
    return errorResponse(
      `You need to auth the following integrations: ${missingUserAuths
        .map((c) => c.type)
        .join(', ')}`,
    );
  }

  const proto = req.headers['x-forwarded-proto'] || 'http';
  const baseUrl = `${proto}://${req.headers.host}/api/app/${appId}/${version}/files`;

  const eszip = await build({ baseUrl, app, version });

  /**const old = await createEsZip({
    baseUrl,
    entrypoint: filename || 'main.ts',
  });*/
  // await fs.writeFile(`/tmp/${deploymentId}.eszip`, eszip, () => {
  //   console.log('done');
  // });

  console.log('booting deplyomentId', deploymentId);

  const layerId = `${deploymentId}@${Math.random() * 1000000}`;

  const secretsMap: Record<string, string> = {};

  app.secrets.forEach((secret: { key: string; encryptedValue: string }) => {
    secretsMap[secret.key] = decryptFromBase64(
      secret.encryptedValue,
      process.env.ENCRYPTION_KEY,
    );
  });

  app.connectors.forEach((connector) => {
    connector.appConnectorUserAuths.forEach((auth) => {
      secretsMap[`${auth.connectorType.toUpperCase()}_USER_TOKEN`] =
        decryptFromBase64(
          auth.encryptedAccessToken,
          process.env.ENCRYPTION_KEY,
        );
    });
  });

  // Boot metadata
  const isolateConfig = {
    // Source URL that will be used for import.meta.url of the entrypoint.
    entrypoint: `${baseUrl}/${FRAMEWORK_ENTRYPOINT}`,

    envs: secretsMap,

    layers: [
      {
        kind: 'eszip',
        id: layerId,
      },
    ],
    inline_layer: layerId,

    permissions: {
      net: true,
    },
  };

  const headers = {
    [X_DENO_CONFIG]: JSON.stringify(isolateConfig),
  };

  return { body: eszip, headers, status: 200 };
}

function originReadBlob(_deploymentId: string, hash?: string) {
  switch (hash) {
    case 'blob-1':
      return new Response('hello');
    case 'blob-2':
      return new Response('goodbye');
  }
  return new Response('No such file', { status: 404 });
}

function originReadTree(_deploymentId: string) {
  const MANIFIEST = {
    entries: {
      '': {
        kind: 'directory',
      },
      '/hello.txt': {
        kind: 'file',
        size: 5,
        hash: 'blob-1',
      },
      '/goodbye.txt': {
        kind: 'file',
        size: 7,
        hash: 'blob-2',
      },
    },
  };

  return new Response(JSON.stringify(MANIFIEST), {
    headers: {
      'content-type': 'application/json',
    },
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
