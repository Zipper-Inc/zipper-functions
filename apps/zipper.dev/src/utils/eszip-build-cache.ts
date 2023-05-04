import Redis from 'ioredis';
import { LoadResponseModule } from '@deno/eszip/types/loader';

export type CacheRecord = {
  module: LoadResponseModule;
  cachedTimestamp: number;
};

/** One week in seconds */
const DEFAULT_TTL = 604800;

const CACHE_KEY_PREFIX = 'eszipBuildCache';
const CACHE_BUST_TIMESTAMP = 1681840170;

/**
 * Makes a cache key for a specifier url
 *
 * @example
 * const cacheKey = getCacheKey('https://deno.land/x/oak@v3.0.0/mod.ts');
 * // cacheKey === `eszipBuildCache-1681840170[https://deno.land/x/oak@v3.0.0/mod.ts]`
 */
const getCacheKey = (specifier: string) =>
  `${CACHE_KEY_PREFIX}-${CACHE_BUST_TIMESTAMP}[${specifier}]`;

function getTtl(headers: Record<string, string>) {
  const maxAge = parseInt(
    headers['maxAge'] ||
      headers['cache-control']?.match(/max-age=([0-9]+)[\s;,]/)?.[1] ||
      '',
    10,
  );
  const age = parseInt(headers['age'] || '', 10);

  if (maxAge && age) return maxAge - age;

  return DEFAULT_TTL;
}

function updateAgeHeader(record: CacheRecord) {
  if (!record.module.headers?.age) return record.module;

  // Let's update the age header since we know how old it was when we fetched it
  const { headers } = record.module;
  const elapsed = Date.now() - record.cachedTimestamp;
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const newAge = headers.age! + elapsed * 1000;

  return {
    ...record.module,
    headers: { ...headers, age: newAge },
  };
}

export class BuildCache {
  private client: Redis;

  constructor() {
    const port = parseInt(process.env.REDIS_PORT || '', 10);
    const host = process.env.REDIS_HOST || '';
    this.client = new Redis(port, host, {
      maxRetriesPerRequest: null,
    });
  }

  disconnect() {
    this.client.disconnect();
  }

  async get(specifier: string) {
    try {
      const raw = await this.client.get(getCacheKey(specifier));
      if (!raw) return;
      const record: CacheRecord = JSON.parse(raw);
      return updateAgeHeader(record);
    } catch (e) {
      // yolo cache miss
    }
  }

  async set(specifier: string, mod: LoadResponseModule) {
    try {
      const key = getCacheKey(specifier);
      const record: CacheRecord = {
        module: mod,
        cachedTimestamp: Date.now(),
      };
      this.client.set(key, JSON.stringify(record));
      this.client.expire(key, getTtl(mod.headers || {}));
    } catch (e) {
      // yolo cache set miss
    }
  }
}

export async function getModule(
  specifier: string,
  buildCache = new BuildCache(),
) {
  const cachedModule = await buildCache.get(specifier);
  if (cachedModule) return cachedModule;

  const response = await fetch(specifier, {
    redirect: 'follow',
  });

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

  const mod = {
    kind: 'module',
    specifier: response.url,
    headers,
    content,
  } as CacheRecord['module'];

  buildCache.set(specifier, mod);

  return mod;
}
