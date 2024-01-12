import {
  Flex,
  FormControl,
  FormLabel,
  Switch,
  Input,
  Box,
  useColorMode,
} from '@chakra-ui/react';
import { LogMessage } from '@zipper/types';
import { baseColors, useCmdOrCtrl } from '@zipper/ui';
import { Console } from '@nicksrandall/console-feed';
import { useEffect, useState } from 'react';
import { useEditorContext } from '../context/editor-context';
import { PRETTY_LOG_TOKENS } from '~/utils/pretty-log';

const prettyLogColors: Record<string, Record<'default' | '_dark', string>> = {
  blue: {
    default: baseColors.blue[600],
    _dark: baseColors.blue[300],
  },
  purple: {
    default: baseColors.purple[600],
    _dark: baseColors.purple[200],
  },
  purpleAlt: {
    default: baseColors.purple[900],
    _dark: baseColors.purple[300],
  },
  'fg.50': {
    default: baseColors.gray[50],
    _dark: baseColors.gray[700],
  },
  'fg.600': {
    default: baseColors.gray[600],
    _dark: baseColors.gray[100],
  },
  fgText: {
    default: baseColors.gray[800],
    _dark: baseColors.gray[25],
  },
  bgColor: {
    default: 'white',
    _dark: baseColors.gray[800],
  },
};

const applyPrettyColors = (colorToken: 'default' | '_dark') => (msg: string) =>
  Object.keys(PRETTY_LOG_TOKENS).reduce(
    (logMessage, colorKey) =>
      logMessage.replace(
        PRETTY_LOG_TOKENS[colorKey]!,
        prettyLogColors[colorKey]?.[colorToken] || PRETTY_LOG_TOKENS[colorKey]!,
      ),
    msg,
  );

export function AppConsole({
  logs,
  showPreserveLogsToggle = true,
}: {
  logs: LogMessage[];
  showPreserveLogsToggle?: boolean;
}) {
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

  const { colorMode } = useColorMode();
  const colorToken = colorMode === 'light' ? 'default' : '_dark';

  return (
    <Box id="app-console" mb={100}>
      {showPreserveLogsToggle && (
        <Box
          position="sticky"
          top="0"
          pt={4}
          zIndex="docked"
          background="bgColor"
        >
          <Flex
            padding={4}
            width="100%"
            border="solid 1px"
            backgroundColor="fg.100"
            borderColor="fg.200"
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
      )}
      <Box
        color="fg.200"
        borderColor="fg.200"
        px={2}
        border="solid 1px"
        borderTop={showPreserveLogsToggle ? 'none' : '1px solid'}
      >
        <Console
          variant={colorMode}
          logs={
            filteredLogs.length
              ? filteredLogs.map(({ timestamp: _ignore, ...log }) => ({
                  ...log,
                  data: log.data.map((datum) => {
                    if (typeof datum === 'string')
                      return applyPrettyColors(colorToken)(datum);
                    return datum;
                  }),
                }))
              : [
                  {
                    id: 'PLACEHOLDER',
                    method: 'info',
                    data: [
                      logFilter
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
