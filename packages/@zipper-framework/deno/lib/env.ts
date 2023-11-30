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

export async function envSet({
  appId,
  key,
  value,
  userId,
}: {
  appId: string;
  key: string;
  value: string;
  userId?: string;
}) {
  if (!key || (value !== '' && !value)) return;

  const path = `/api/app/${appId}/secret`;

  const body = { key, value, userId };
  const { hmac, timestamp } = generateHmac('POST', path, body);
  try {
    await fetch(
      `https://${Deno.env.get('PUBLICLY_ACCESSIBLE_RPC_HOST')}${path}`,
      {
        method: 'POST',
        headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
        body: JSON.stringify(body),
      },
    );
  } catch (e) {
    console.error('Could not add secret', e);
  }
}
