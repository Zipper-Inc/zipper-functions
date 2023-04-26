export type LogMethod =
  | 'log'
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'
  | 'table'
  | 'clear'
  | 'time'
  | 'timeEnd'
  | 'count'
  | 'assert';

export interface Log {
  id: string;
  // The log method
  method: LogMethod;
  // The arguments passed to console API
  data: any[];
  // Time of log
  timestamp?: string;
}

export type LogRecord = Omit<Log, 'timestamp'> & {
  timestamp: number;
};
