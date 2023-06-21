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

export class ZipperStorage<Value extends Zipper.Serializable> implements Zipper.Storage<Value> {
  public appId: string;

  constructor(appId: string) {
    this.appId = appId;
  }

  async getAll() {
    const path = `/api/app/${this.appId}/storage`;
    const { hmac, timestamp } = generateHmac('GET', path);

    const res = await fetch(Deno.env.get('RPC_HOST') + path, {
      headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
    });

    const result = await res.json();
    return result;
  }

  async get(key: string) {
    const path = `/api/app/${this.appId}/storage?key=${key}`;
    const { hmac, timestamp } = generateHmac('GET', path);

    const res = await fetch(Deno.env.get('RPC_HOST') + path, {
      headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
    });

    const result = await res.json();
    return result.value
  }

  async set(key: string, value: Value) {
    const path = `/api/app/${this.appId}/storage`;
    const { hmac, timestamp } = generateHmac('POST', path, { key, value });

    const res = await fetch(Deno.env.get('RPC_HOST') + path, {
      headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
      method: 'POST',
      body: JSON.stringify({ key, value }),
    });

    return res.json();
  }

  async delete(key: string) {
    const path = `/api/app/${this.appId}/storage?key=${key}`;
    const { hmac, timestamp } = generateHmac('DELETE', path);

    const res = await fetch(Deno.env.get('RPC_HOST') + path, {
      headers: { 'x-zipper-hmac': hmac, 'x-timestamp': timestamp },
      method: 'DELETE',
    });

    return res.json();
  }
}
