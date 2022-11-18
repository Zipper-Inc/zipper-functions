import { NextApiRequest, NextApiResponse } from 'next';
import * as jose from 'jose';
import { build } from '@deno/eszip';
import { trpcRouter } from '~/server/routers/_app';
import { createContext } from '~/server/context';
import pako from 'pako';
import { PassThrough } from 'stream';
import ndjson from 'ndjson';
import intoStream from 'into-stream';
import { decryptFromBase64 } from '~/server/utils/crypto.utils';
import { prisma } from '~/server/prisma';

const X_DENO_CONFIG = 'x-deno-config';

/**
 * Assuming the user has defined a function called `main`
 * This wrapper injects some code that:
 *  - gets inputs from the request
 *  - calls the user's main function
 *  - handles standardizing output and errors
 */
export const wrapMainFunction = ({
  code,
  name,
  appId,
  version = Date.now().toString(),
}: {
  code: string;
  name: string;
  appId: string;
  version: string;
}) => `
${code}

/*****************************************************************/

const Zipper = { env: Deno.env };

const fn = typeof main === 'undefined' ? () => {
  throw new Error('You must define a main function')
}: main;

const getInputFromBody = async (req) => {
  if (req.method === "GET") {
    const url = new URL(req.url);
    return Object.fromEntries(url.searchParams.entries());
  } else if (req.body) {
    return req.json();
  } else {
    return {};
  }
};

addEventListener('fetch', async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'X-Zipper-Deployment': '${appId}}.${version}',
  };

  const input = await getInputFromBody(event.request);

  const __meta = {
    name: '${name}',
    appId: '${appId}',
    version: '${version}',
    url: event.request.url,
    method: event.request.method,
    input,
  };

  try {
    const output = await fn(input);
    const response = {
      ok: true,
      data: output,
      __meta,
    };

    event.respondWith(
      new Response(JSON.stringify(response), {
        status: 200,
        headers,
      }),
    );

  } catch(error) {
    const response = {
      ok: false,
      error,
      __meta,
    };

    console.error(error);

    event.respondWith(
      new Response(JSON.stringify(response), {
        status: 500,
        headers,
      }),
    );
  }
});
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

const createEsZip = async ({ app, baseUrl }: { app: any; baseUrl: string }) => {
  const mainScript = app.scripts.find(
    ({ id }: any) => app.scriptMain?.scriptId === id,
  );
  return build(
    [`${baseUrl}/${mainScript?.filename}`],
    async (specifier: string) => {
      console.log("ESZIP: '", specifier);

      if (specifier.startsWith(baseUrl)) {
        const response = await fetch(specifier, { credentials: 'same-origin' });
        const content = await response.text();

        return {
          specifier,
          headers: {
            'content-type': 'text/typescript',
          },
          content,
          kind: 'module',
          version: '1.0.0',
        };
      }

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
    },
  );
};

/** @todo use a real deployment id instead of an app id. deployment id should be app id and version or something */
async function originBoot({
  req,
  id: deploymentId,
}: {
  req: NextApiRequest;
  id: string;
}) {
  const [appId, version] = deploymentId.split('@');

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
    },
  });

  if (!app) {
    return { body: `App with ${appId} does not exist`, status: 404 };
  }

  const proto = req.headers['x-forwarded-proto'] || 'http';

  const eszip = await createEsZip({
    app,
    baseUrl: `${proto}://${req.headers.host}/api/app/${appId}/${version}`,
  });

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

  // Boot metadata
  const isolateConfig = {
    // Source URL that will be used for import.meta.url of the entrypoint.
    entrypoint: `https://${req.headers.host}/api/app/${appId}/${version}/main.ts`,

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
