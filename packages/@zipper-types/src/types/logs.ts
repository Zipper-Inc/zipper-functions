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

export type Log = Zipper.Log.Message;

export type LogRecord = Zipper.Log.SortableMessage;

export type ConsoleLogger = {
  fetch: (fromTimestamp?: number) => Promise<Log[]>;
  send: (log: LogRecord) => void;
} & Record<LogMethod, (...data: Log['data']) => void>;
