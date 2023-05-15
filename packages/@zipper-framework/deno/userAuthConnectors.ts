import { hmac as _generateHmac } from 'https://deno.land/x/hmac@v2.0.1/mod.ts';

function generateHmac(
  method: 'GET' | 'POST' | 'DELETE',
  path: string,
  body: Record<string, unknown> = {},
) {
  const timestamp = Date.now().toString();

  return {
    hmac: _generateHmac(
      'sha256',
      Deno.env.get('HMAC_SIGNING_SECRET') || '',
      method + '__' + path + '__' + JSON.stringify(body) + '__' + timestamp,
      'utf8',
      'hex',
    ) as string,
    timestamp,
  };
}

export const getUserConnectorAuths = async () => {
  let path = `/api/app/${this.appId}/userAuthConnectors`;
  const { hmac, timestamp } = generateHmac('GET', path);

  const res = await fetch(Deno.env.get('RPC_HOST') + path, {
    headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
  });

  return res.json();
};
