import { NextApiRequest, NextApiResponse } from 'next';
import * as jose from 'jose';

type DeploymentIdType =
  | 'd-ephemeral'
  | 'd-subhosted'
  | 'd-url'
  | 'd-envs'
  | 'd-meta'
  | 'd-files'
  | 'd-headers'
  | 'd-net-allowed'
  | 'd-net-blocked';

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
  if (!args.deployment_id) throw new Error('Missing deployment_id');
  // Validate JWT
  const payload = await decodeAuthHeader(req);
  // Sanity check JWT deploymentId matches the one provided via args
  if (payload.deployment_id !== args.deployment_id) {
    throw new Error(
      `DeploymentID mismatch (JWT != QS): '${payload.deployment_id}' != ${args.deployment_id}`,
    );
  }
  // Dispatch RPCs
  console.log(url.pathname);
  switch (url.pathname) {
    case '/v0/boot':
      return await originBoot(args.deployment_id, res);
    case '/v0/read_blob':
      return originReadBlob(args.deployment_id, args.hash);
    case '/v0/read_tree':
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
  const verified = await jose.jwtVerify(token, secretKey);
  return verified.payload;
}

async function originBoot(deploymentId: string, res: NextApiResponse) {
  const PAYLOADS = {
    'd-ephemeral':
      'https://gist.github.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/b8e2259764545f56bb29baf5457a0ee5cd70a4d4/ephemeral.js',
    'd-subhosted':
      'https://gist.github.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/b8e2259764545f56bb29baf5457a0ee5cd70a4d4/subhosted.js',
    'd-url':
      'https://gist.github.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/b8e2259764545f56bb29baf5457a0ee5cd70a4d4/url.js',
    'd-envs':
      'https://gist.githubusercontent.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/c56d8ae3cb136e832dca8519f523637fa8637c05/envs.js',
    'd-meta':
      'https://gist.githubusercontent.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/cfd6a077932522b5be2f9c7f998677586d163240/meta_url.js',
    'd-files':
      'https://gist.githubusercontent.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/6559c3e6c65e0dcbdd0468ae1136084c4e9493ee/files.js',
    'd-headers':
      'https://gist.githubusercontent.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/3e83dff11c08da8b028bb15defd5aa628edd0cfe/headers.js',
    'd-net-allowed':
      'https://gist.githubusercontent.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/db0cdee189f4695660c302b8658fde25015f75e3/ipify.js',
    'd-net-blocked':
      'https://gist.githubusercontent.com/AaronO/0610daef96940d4491b8234a08b73e24/raw/db0cdee189f4695660c302b8658fde25015f75e3/ipify.js',
  };
  const payloadUrl = PAYLOADS[deploymentId as DeploymentIdType];
  if (!payloadUrl) {
    return new Response(`No boot payload for ${deploymentId}`, { status: 404 });
  }

  // TODO(@AaronO): inject header to disambiguate between JS bundles and eszips
  const payloadResp = await fetch(payloadUrl);
  if (!payloadResp.ok) {
    res.status(500).send(`Failed to fetch upstream payload: ${deploymentId}`);
  }

  let netPermissions;
  if (deploymentId === 'd-net-allowed') {
    netPermissions = ['api.ipify.org'];
  } else if (deploymentId === 'd-net-blocked') {
    netPermissions = false;
  } else {
    netPermissions = true;
  }

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
      net: netPermissions,
    },
  };
  // Inject isolateConfig into headers
  const payloadHeaders = Object.fromEntries(payloadResp.headers.entries());
  const headers = Object.assign(payloadHeaders, {
    [X_DENO_CONFIG]: JSON.stringify(isolateConfig),
  });

  return new Response(payloadResp.body, { headers });
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
