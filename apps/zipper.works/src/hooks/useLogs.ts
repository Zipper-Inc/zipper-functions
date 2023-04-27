import { Log, ConsoleLogger } from '@zipper/types';
import { useEffect, useRef, useState } from 'react';
import { LoggerParams, getLogger } from '../utils/app-logs';

export function useLogs(
  { appId, version, runId }: LoggerParams,
  pollingMs = 1000,
) {
  const pollingTimer = useRef<number>();
  const logger = useRef<ConsoleLogger>(getLogger({ appId, version, runId }));
  const fromTimestamp = useRef<number>(0);
  const [logs, setLogs] = useState<Log[]>([]);

  useEffect(() => {
    window.clearTimeout(pollingTimer.current);
    if (!appId || !version) return;

    const poll = async () => {
      setLogs(await logger.current.fetch(fromTimestamp.current));
      pollingTimer.current = window.setTimeout(poll, pollingMs);
    };

    poll();
  }, [appId, version, runId]);

  return {
    logger: logger.current,
    logs,
    cancel: () => window.clearTimeout(pollingTimer.current),
  };
}
