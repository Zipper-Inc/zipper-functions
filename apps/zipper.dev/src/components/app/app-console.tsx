import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Input,
  Box,
} from '@chakra-ui/react';
import { LogMessage } from '@zipper/types';
import { useCmdOrCtrl } from '@zipper/ui';
import { Console } from '@nicksrandall/console-feed';
import { useEffect, useState } from 'react';
import { useEditorContext } from '../context/editor-context';

export function AppConsole({ logs }: { logs: LogMessage[] }) {
  const [logCounter, setLogCounter] = useState(0);
  const [logFilter, setLogFilter] = useState('');

  const { setLogStore, setPreserveLogs, preserveLogs } = useEditorContext();

  useCmdOrCtrl('K', () => setLogStore(() => ({})));

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
  const filteredLogs = revealedLogs.filter((log) =>
    JSON.stringify(log.data).toLowerCase().includes(logFilter.toLowerCase()),
  );

  return (
    <Box id="app-console">
      <Box position="sticky" top="0" pt={4} zIndex="docked" background="bgColor">
        <Flex
          padding={4}
          width="100%"
          border="solid 1px"
          backgroundColor="fg100"
          borderColor="fg200"
          borderTopRadius="md"
        >
          <FormControl display="flex" alignItems="center" height={6}>
            <Switch
              colorScheme="purple"
              id="preserve-logs"
              size="sm"
              checked={preserveLogs}
              defaultChecked={true}
              onChange={() => setPreserveLogs(!preserveLogs)}
            />
            <FormLabel
              htmlFor="preserve-logs"
              ml={2}
              mb="0"
              fontWeight="normal"
              fontSize="xs"
            >
              Preserve logs
            </FormLabel>
          </FormControl>
          <Input
            backgroundColor="bgColor"
            fontFamily="monospace"
            fontSize="xs"
            onChange={(e) => setLogFilter(e.target.value)}
            height={6}
            placeholder="Filter"
          />
        </Flex>
      </Box>
      <Box
        color="fg200"
        borderColor="fg200"
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
