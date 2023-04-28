import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Input,
  Box,
} from '@chakra-ui/react';
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
    <Box id="app-console">
      <Flex
        padding={4}
        width="100%"
        border="solid 1px"
        backgroundColor="gray.100"
        borderColor="gray.200"
        borderTopRadius="md"
        position="sticky"
        top={0}
        zIndex="docked"
      >
        <FormControl display="flex" alignItems="center" height={6}>
          <Switch
            colorScheme="purple"
            id="show-deploy-logs"
            size="sm"
            checked={showDeployLogs}
            defaultChecked={true}
            onChange={() => setShowDeployLogs(!showDeployLogs)}
          />
          <FormLabel
            htmlFor="show-deploy-logs"
            ml={2}
            mb="0"
            fontWeight="normal"
            fontSize="xs"
          >
            Show deploy logs
          </FormLabel>
        </FormControl>
        <Input
          backgroundColor="white"
          fontFamily="monospace"
          fontSize="xs"
          onChange={(e) => setLogFilter(e.target.value)}
          height={6}
          placeholder="Filter"
        />
      </Flex>
      <Box
        color="gray.200"
        borderColor="gray.200"
        borderBottomRadius="md"
        px={2}
        border="solid 1px"
        borderTop="none"
      >
        <Console
          logs={
            filteredLogs.length
              ? filteredLogs.map(({ timestamp: _ignore, ...log }) => log)
              : [
                  {
                    id: 'PLACEHOLDER',
                    method: 'info',
                    data: [
                      !!logFilter
                        ? '%c No matching logs found.'
                        : '%c No logs yet.',
                      'opacity: .5',
                    ],
                  },
                ]
          }
          styles={{
            BASE_LINE_HEIGHT: 'inherit',
            TREENODE_LINE_HEIGHT: 'inherit',
            LOG_ICON_HEIGHT: '22px',
            /** 
             * @TODO replace icons with better zipper-y ones
             *
            LOG_ICON: '',
            LOG_COMMAND_ICON: '',
            LOG_ERROR_ICON: '',
            LOG_INFO_ICON: '',
            LOG_RESULT_ICON: '',
            LOG_WARN_ICON: '',
             */
          }}
        />
      </Box>
    </Box>
  );
}
