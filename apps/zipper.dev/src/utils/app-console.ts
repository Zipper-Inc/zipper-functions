import {
  logMethods,
  LogMessage,
  ConsoleLogger,
  LogMethod,
} from '@zipper/types';
import { uuid } from '@zipper/utils';
import { prisma } from '~/server/prisma';

export type LoggerParams = {
  appId: string;
  version: string;
  runId?: string;
};

/**
 * Send a log object to a given appId, version and runId
 */
export async function sendLog({
  appId,
  version,
  runId,
  log,
}: LoggerParams & { url?: URL; log: LogMessage }) {
  await prisma.appLog.create({
    data: {
      appId: appId.toString(),
      version: version.toString(),
      runId: runId?.toString(),
      method: log.method,
      timestamp: new Date(log.timestamp),
      data: JSON.parse(JSON.stringify(log.data)),
    },
  });
}

/**
 * Make a Log record object with reasonable defaults
 */
export function makeLog({
  id = uuid(),
  method = LogMethod.log,
  timestamp = new Date(Date.now()),
  data = [],
}: Partial<LogMessage>) {
  return {
    id,
    method,
    timestamp,
    data,
  };
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
  const initialLogger = {
    send: (log: LogMessage) => sendLog({ appId, version, runId, log }),
  };

  const getLoggerForMethod =
    (method: LogMethod) =>
    (...data: Zipper.Serializable[]) =>
      sendLog({
        appId,
        version,
        runId,
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
