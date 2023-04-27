import { Flex, FormControl, FormLabel, Switch, Input } from '@chakra-ui/react';
import { LogMessage } from '@zipper/types';
import { Console } from 'console-feed';
import { useEffect, useState } from 'react';

const isDeployLog = (log: LogMessage) =>
  log.data?.[0]?.toString().startsWith('%c DEPLOY');

export function AppConsole({ logs }: { logs: LogMessage[] }) {
  const [logCounter, setLogCounter] = useState(0);
  const [logFilter, setLogFilter] = useState('');
  const [showDeployLogs, setShowDeployLogs] = useState(true);

  // Slightly animate
  useEffect(() => {
    // Handle resetting
    if (!logs.length) {
      if (logCounter) setLogCounter(0);
      return;
    }

    // Animate each log being added
    if (logs[logCounter] && logCounter < logs.length)
      setTimeout(() => setLogCounter(logCounter + 1), 1000 / 60);
  }, [logs, logCounter]);

  const revealedLogs = logs.slice(0, logCounter);
  const filteredLogs = revealedLogs
    .filter((log) =>
      JSON.stringify(log.data).toLowerCase().includes(logFilter.toLowerCase()),
    )
    .filter((log) => (showDeployLogs ? true : !isDeployLog(log)));

  return (
    <>
      {revealedLogs.length ? (
        <Flex marginBottom={2} marginLeft={2}>
          <FormControl display="flex" alignItems="center" height={6}>
            <FormLabel htmlFor="show-deploy-logs-alerts" mb="0" fontSize="xs">
              Show deploy logs
            </FormLabel>
            <Switch
              id="show-deploy-logs"
              size="sm"
              checked={showDeployLogs}
              defaultChecked={true}
              onChange={() => setShowDeployLogs(!showDeployLogs)}
            />
          </FormControl>
          <Input
            fontFamily="monospace"
            fontSize="xs"
            onChange={(e) => setLogFilter(e.target.value)}
            height={6}
            p={2}
            placeholder="Filter"
            marginBottom={2}
          />
        </Flex>
      ) : null}
      <Console
        logs={filteredLogs.map(({ timestamp: _ignore, ...log }) => log)}
        styles={{
          BASE_LINE_HEIGHT: 'inherit',
          TREENODE_LINE_HEIGHT: 'inherit',
        }}
      />
    </>
  );
}
