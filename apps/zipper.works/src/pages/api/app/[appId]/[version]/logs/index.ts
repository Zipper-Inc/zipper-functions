import { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';
import { LogRecord } from '@zipper/types';

/** One day in seconds */
const DEFAULT_TTL = 86400;
const CACHE_KEY_PREFIX = 'logStash';

/**
 * Logging that uses the list commands on Redis
 * @todo replace with a real logger of some kind
 */
class RedisLogger {
  key: string;
  private client: Redis;

  constructor({
    appId,
    version,
    runId,
    port = parseInt(process.env.REDIS_PORT || '', 10),
    host = process.env.REDIS_HOST || '',
  }: {
    appId: string;
    version: string;
    runId?: string;
    port?: number;
    host?: string;
  }) {
    this.key = `${CACHE_KEY_PREFIX}[${appId}@${version}]`;
    if (runId) this.key = `${this.key}[${runId}]`;

    this.client = new Redis(port, host, {
      maxRetriesPerRequest: null,
    });
  }

  async get(fromTimestamp?: number): Promise<LogRecord[]> {
    try {
      const logs = (await this.client.lrange(this.key, 0, -1))
        .map((l) => JSON.parse(l) as LogRecord)
        .sort((a, b) => a.timestamp - b.timestamp);

      return fromTimestamp
        ? logs.filter((log) => log.timestamp > fromTimestamp)
        : logs;
    } catch (_e) {
      return [];
    }
  }

  async log(record: LogRecord): Promise<number> {
    this.client.expire(this.key, DEFAULT_TTL);
    return this.client.rpush(this.key, JSON.stringify(record));
  }

  purge(): Promise<'OK'> {
    return this.client.ltrim(this.key, 0, -1);
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { appId, version, runId, fromTimestamp } = req.query;
  if (!appId || !version) return res.status(500);

  const logger = new RedisLogger({
    appId: appId.toString(),
    version: version.toString(),
    runId: runId?.toString(),
  });

  switch (req.method) {
    case 'DELETE': {
      await logger.purge();
      return res.status(205).send(`Purged ${logger.key}`);
    }

    case 'POST': {
      const record = JSON.parse(req.body) as LogRecord;
      const result = await logger.log(record);
      return res.status(201).send(result);
    }

    case 'GET':
    default: {
      const result = await logger.get(
        fromTimestamp ? parseInt(fromTimestamp.toString(), 10) : undefined,
      );
      return res.status(200).send(JSON.stringify(result));
    }
  }
}
