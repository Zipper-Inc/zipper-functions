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

export interface Log {
  id: string;
  // The log method
  method: LogMethod;
  // The arguments passed to console API
  data: Zipper.Serializable[];
  // Time of log
  timestamp?: string;
}

export type LogRecord = Omit<Log, 'timestamp'> & {
  timestamp: number;
};

export type ConsoleLogger = {
  fetch: (fromTimestamp?: number) => Promise<Log[]>;
  send: (log: LogRecord) => void;
} & Record<LogMethod, (...data: Log['data']) => void>;
