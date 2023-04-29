export enum LogMethod {
  log = 'log',
  debug = 'debug',
  info = 'info',
  warn = 'warn',
  error = 'error',
  table = 'table',
  clear = 'clear',
  time = 'time',
  timeEnd = 'timeEnd',
  count = 'count',
  assert = 'assert',
}

export const logMethods = Object.values(LogMethod);

export type LogMessage = Zipper.Log.Message;

export type ConsoleLogger = {
  url: string;
  fetch: (fromTimestamp?: number) => Promise<LogMessage[]>;
  send: (log: LogMessage) => void;
} & Record<LogMethod, (...data: LogMessage['data']) => void>;
