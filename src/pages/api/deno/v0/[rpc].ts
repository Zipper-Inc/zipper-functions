import { NextApiRequest, NextApiResponse } from 'next';
import * as jose from 'jose';
import { prisma } from '~/server/prisma';
import { trpcRouter } from '~/server/routers/_app';
import { createContext } from '~/server/context';

const X_DENO_CONFIG = 'x-deno-config';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  console.log(req.method, req.url);
  if (!req.url) return new Response('No URL', { status: 400 });

  const url = new URL(
    req.url,
    `${process.env.NODE_ENV === 'development' ? 'http' : 'https'}://${
      req.headers.host
    }`,
  );
  // Take RPC args from query string
  const args = Object.fromEntries(url.searchParams.entries());
  // if (!args.deployment_id) throw new Error('Missing deployment_id');
  // Validate JWT
  const payload = await decodeAuthHeader(req);
  // Sanity check JWT deploymentId matches the one provided via args
  if (args.deployment_id && payload.deployment_id !== args.deployment_id) {
    throw new Error(
      `DeploymentID mismatch (JWT != QS): '${payload.deployment_id}' != ${args.deployment_id}`,
    );
  }
  // Dispatch RPCs
  console.log(url.pathname);
  switch (url.pathname) {
    case '/api/deno/v0/boot': {
      const { body, headers, status } = await originBoot({
        req,
        res,
        id: args.deployment_id,
      });
      if (headers) {
        Object.keys(headers).forEach((key) => {
          res.setHeader(key, headers[key] || '');
        });
      }
      res.status(status || 200).send(body);
    }
    case '/api/deno/v0/read_blob':
      return originReadBlob(args.deployment_id, args.hash);
    case 'api/deno/v0/read_tree':
      return originReadTree(args.deployment_id);
  }
  return new Response(`¯\\_(ツ)_/¯`, { status: 500 });
}

async function decodeAuthHeader(req: NextApiRequest) {
  const authHeader = req.headers?.authorization;
  console.log(req.headers);
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

/** @todo use a real deployment id instead of an app id. deployment id should be app id and version or something */
async function originBoot({
  req,
  res,
  id: deploymentId,
}: {
  req: NextApiRequest;
  res: NextApiResponse;
  id: string;
}) {
  console.log('booting deplyomentId', deploymentId);

  const [appId, _] = deploymentId.split('---');

  const caller = trpcRouter.createCaller(createContext({ req, res }));
  const app = await caller.query('app.byId', {
    id: appId,
  });

  if (!app) {
    return { body: `App with ${appId} does not exist`, status: 404 };
  }

  // Get the main script
  const mainScript = app.scripts.find(
    ({ id }) => app.scriptMain?.scriptId === id,
  );

  const body = mainScript?.code;

  // TODO(@AaronO): inject header to disambiguate between JS bundles and eszips
  // @ibu: this part used to fetch the code from github gists

  // Boot metadata
  const isolateConfig = {
    // Optional envs, accessible in isolates via Deno.env.get(...) or Deno.env.toObject()
    envs: {
      // API_TOKEN: ...,
      HELLO: 'H3110',
    },

    // Source URL that will be used for import.meta.url of the entrypoint.
    entrypoint: 'file:///src/main.js', // or "https://example.com/main.js"

    // Permissions can be used to lockdown network access via an allowlist, etc...
    permissions: {
      // net: true/false/["foo.com", "bar.com"]
      net: true,
    },
  };
  // Inject isolateConfig into headers
  // const payloadHeaders = Object.fromEntries(payloadResp.headers.entries());
  const headers = {
    [X_DENO_CONFIG]: JSON.stringify(isolateConfig),
  };

  return { body, headers, status: 200 };
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
