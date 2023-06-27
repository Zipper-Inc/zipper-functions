import { NextApiRequest, NextApiResponse } from 'next';
import * as jose from 'jose';
import pako from 'pako';
import { PassThrough } from 'stream';
import ndjson from 'ndjson';
import intoStream from 'into-stream';
import { decryptFromBase64, parseDeploymentId } from '@zipper/utils';
import { prisma } from '~/server/prisma';
import { build, FRAMEWORK_ENTRYPOINT } from '~/utils/eszip-build-applet';
import { getBranchHash, getAppVersionFromHash } from '~/utils/hashing';

const X_DENO_CONFIG = 'x-deno-config';

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
  // eslint-disable-next-line prefer-const
  const {
    appId,
    version: deploymentVersion,
    branch,
  } = parseDeploymentId(deploymentId);

  if (!appId || !deploymentVersion) {
    console.error('Missing appId and version');
    return;
  }

  const app = await prisma.app.findFirst({
    where: {
      id: appId,
    },
    include: {
      branches: {
        where: {
          name: branch,
        },
        include: {
          scripts: true,
        },
      },
      secrets: true,
      connectors: true,
    },
  });

  if (!app) {
    return errorResponse(`Missing app ID`);
  }

  const version =
    deploymentVersion === 'latest'
      ? getAppVersionFromHash(
          app.branches[0]?.hash ||
            getBranchHash({ app, scripts: app.branches[0]?.scripts || [] }),
        )
      : deploymentVersion;

  const baseUrl = `file://${app.slug}/v${version}`;

  const eszip = await build({
    baseUrl,
    app: { ...app, scripts: app.branches[0]?.scripts || [] },
    version,
  });

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
