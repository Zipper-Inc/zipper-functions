import { Box, Flex, Text, Tag, Icon } from '@chakra-ui/react';
import {
  InfoOutlineIcon,
  WarningIcon,
  WarningTwoIcon,
  QuestionIcon,
  CheckIcon,
} from '@chakra-ui/icons';
import { useEffect } from 'react';

enum LogLevel {
  Info = 'info',
  Warning = 'warning',
  Error = 'error',
  Boot = 'boot',
  Default = 'log',
}

const LOG_COLORS = {
  [LogLevel.Info]: {
    bg: 'transparent',
    color: 'gray.600',
  },
  [LogLevel.Warning]: {
    bg: 'yellow.100',
    color: 'yellow.800',
  },
  [LogLevel.Error]: {
    bg: 'red.200',
    color: 'red.800',
  },
  [LogLevel.Boot]: {
    bg: 'green.200',
    color: 'green.800',
  },
  [LogLevel.Default]: {
    bg: 'gray.800',
    color: 'gray.200',
  },
};

const LOG_LEVEL_ICONS = {
  [LogLevel.Info]: InfoOutlineIcon,
  [LogLevel.Warning]: WarningTwoIcon,
  [LogLevel.Error]: WarningIcon,
  [LogLevel.Boot]: CheckIcon,
  [LogLevel.Default]: QuestionIcon,
};

export function LogLine({ log }: { log: any }) {
  const level: LogLevel =
    log.level ||
    (log.boot_time && LogLevel.Boot) ||
    (log.exception && LogLevel.Error) ||
    LogLevel.Default;

  const msg =
    log.msg ||
    (log.boot_time &&
      `Booted in ${Math.round(parseFloat(log.boot_time) * 1000)}ms`) ||
    log.exception ||
    JSON.stringify(log);

  useEffect(() => {
    if (!level || !msg) console.log('?', log);
    console.log(
      '%c[ZIPPER-FUNCTIONS]',
      'color: purple; background: gray; ',
      `[${level}]`,
      msg,
    );
  }, []);

  const Icon = LOG_LEVEL_ICONS[level];

  return (
    <Flex {...LOG_COLORS[level]} px={2} py={1} width="100%">
      <Icon mt={'3px'} mr="2" />
      <Text maxW="90%">{msg}</Text>
    </Flex>
  );
}
