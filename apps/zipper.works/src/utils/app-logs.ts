import {
  Log,
  logMethods,
  LogRecord,
  ConsoleLogger,
  LogMethod,
} from '@zipper/types';
import { safeJSONStringify, uuid } from '@zipper/utils';

export type LoggerParams = {
  appId: string;
  version: string;
  runId?: string;
};

/**
 * Get the URL to send/recieve logs
 */
export function getLogsApiUrl({ appId, version, runId }: LoggerParams) {
  const url = new URL(process.env.NEXT_PUBLIC_ZIPPER_API_URL as string);
  url.pathname = `/api/app/${appId}/${version}/logs`;
  if (runId) url.pathname = `${url.pathname}/${runId}`;
  return url;
}

/**
 * Fetch logs by appId, version and runId
 * You can also fetch after timestamp, useful for polling
 */
export async function fetchLogs({
  appId,
  version,
  runId,
  url = getLogsApiUrl({ appId, version, runId }),
  fromTimestamp,
}: LoggerParams & { url?: URL; fromTimestamp?: number }) {
  if (fromTimestamp)
    url.searchParams.set('fromTimestamp', fromTimestamp.toString());
  const raw = await fetch(url);
  const json = (await raw.json()) as LogRecord[];
  return json.map(
    (log) => ({ ...log, timestamp: log.timestamp.toString() } as Log),
  );
}

/**
 * Send a log object to a given appId, version and runId
 */
export async function sendLog({
  appId,
  version,
  runId,
  url = getLogsApiUrl({ appId, version, runId }),
  log,
}: LoggerParams & { url?: URL; log: LogRecord }) {
  await fetch(url, { method: 'POST', body: safeJSONStringify(log) });
}

/**
 * Make a Log record object with reasonable defaults
 */
export function makeLog({
  id = uuid(),
  method = LogMethod.log,
  timestamp = Date.now(),
  data = [],
}: Partial<LogRecord>) {
  return { id, method, timestamp, data };
}

/**
 * Get a logger object for a given appId, version, and runId
 * Has all the same methods as console.*
 */
export function getLogger({
  appId,
  version,
  runId,
}: LoggerParams): ConsoleLogger {
  const url = getLogsApiUrl({ appId, version, runId });

  const initialLogger = {
    send: (log: LogRecord) => sendLog({ appId, version, runId, url, log }),
    fetch: (fromTimestamp: number) =>
      fetchLogs({ appId, version, runId, url, fromTimestamp }),
  };

  const getLoggerForMethod =
    (method: LogMethod) =>
    (...data: Zipper.Serializable[]) =>
      sendLog({
        appId,
        version,
        runId,
        url,
        log: makeLog({ method, data }),
      });

  // Go through each log method and attach it to the logger object
  return logMethods.reduce<any>(
    (previous, method) => ({
      ...previous,
      [method]: getLoggerForMethod(method),
    }),
    initialLogger,
  );
}
