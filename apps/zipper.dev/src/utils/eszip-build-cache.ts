import type { LoadResponseModule } from '@deno/eszip/esm/loader';
import { Target } from './rewrite-imports';
import Redis from 'ioredis';

export type CacheKeyPair = [specifier: string, target?: Target];
export type CacheRecord = {
  module: LoadResponseModule;
  cachedTimestamp: number;
};

/** One week in seconds */
const DEFAULT_TTL = 604800;

const CACHE_KEY_PREFIX = 'eszipBuildCache';
const CACHE_BUST_TIMESTAMP = 1698114625;

/**
 * Makes a cache key for a specifier url
 *
 * @example
 * const cacheKey = getCacheKey('https://deno.land/x/oak@v3.0.0/mod.ts');
 * // cacheKey === `eszipBuildCache-1681840170[https://deno.land/x/oak@v3.0.0/mod.ts]`
 */
const getCacheKey = ([specifier, target = Target.Default]: CacheKeyPair) =>
  `${CACHE_KEY_PREFIX}-${CACHE_BUST_TIMESTAMP}[${specifier}][target-${target}]`;

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

  async get(keyPair: CacheKeyPair) {
    try {
      const raw = await this.client.get(getCacheKey(keyPair));
      if (!raw) return;
      const record: CacheRecord = JSON.parse(raw);
      return updateAgeHeader(record);
    } catch (e) {
      // yolo cache miss
    }
  }

  async set(keyPair: CacheKeyPair, mod: LoadResponseModule) {
    try {
      const key = getCacheKey(keyPair);
      const record: CacheRecord = {
        module: mod,
        cachedTimestamp: Date.now(),
      };
      await this.client.set(key, JSON.stringify(record));
      await this.client.expire(key, getTtl(mod.headers || {}));
    } catch (e) {
      // yolo cache set miss
    }
  }
}
