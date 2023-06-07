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

export const getUserConnectorAuths = async (appId: string, userId: string) => {
  let path = `/api/app/${appId}/userAuthConnectors`;
  const body = { userId };
  const { hmac, timestamp } = generateHmac('POST', path, body);

  const res = await fetch(Deno.env.get('RPC_HOST') + path, {
    method: 'POST',
    headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
    body: JSON.stringify(body),
  });

  return res.json();
};
