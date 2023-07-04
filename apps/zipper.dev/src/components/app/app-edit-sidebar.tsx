import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  VStack,
  Box,
  Flex,
  Text,
  HStack,
  Button,
  Tooltip,
  useToast,
  IconButton,
  Heading,
  useClipboard,
  ListItem,
  UnorderedList,
} from '@chakra-ui/react';
import { TabButton } from '@zipper/ui';
import { useState } from 'react';
import { useRunAppContext } from '../context/run-app-context';

import { HiOutlineClipboard, HiOutlinePlay } from 'react-icons/hi2';
import { useEditorContext } from '../context/editor-context';
import Link from 'next/link';
import { getAppLink } from '@zipper/utils';
import AppEditSidebarApplet from './app-edit-sidebar-applet';
import { AppConsole } from './app-console';

type AppEditSidebarProps = {
  showInputForm: boolean;
  tips?: JSX.Element;
  appSlug: string;
};

export const AppEditSidebar: React.FC<AppEditSidebarProps> = ({
  showInputForm = true,
  tips,
  appSlug,
}) => {
  const toast = useToast();
  const [tabIndex, setTabIndex] = useState(0);

  const consoleTabIndex = tips ? 2 : 1;

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
    if (index === consoleTabIndex) {
      markLogsAsRead();
    }
  };

  const { isRunning, run, formMethods } = useRunAppContext();

  const {
    currentScript,
    inputParams,
    inputError,
    logs,
    markLogsAsRead,
    lastReadLogsTimestamp,
    editorHasErrors,
    getErrorFiles,
  } = useEditorContext();

  const unreadLogs = logs.filter(
    (log) => log.timestamp > lastReadLogsTimestamp,
  ).length;

  const [inputs, setInputs] = useState<Record<string, any>>({});

  const appLink = getAppLink(appSlug);
  const { onCopy } = useClipboard(
    `${appLink}${
      currentScript?.filename === 'main.ts'
        ? ''
        : `/${currentScript?.filename.slice(0, -3)}`
    }`,
  );

  const copyLink = async () => {
    onCopy();
    toast({
      title: 'App link copied',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
  };

  const isLibrary = !inputParams && !inputError;
  const isHandler = inputParams || inputError;
  const errorTooltip =
    inputError ||
    (editorHasErrors() && (
      <>
        Fix errors in the following files before running:
        <UnorderedList>
          {getErrorFiles().map((f, i) => (
            <ListItem key={`[${i}] ${f}`}>{f}</ListItem>
          ))}
        </UnorderedList>
      </>
    ));

  const setInputsAtTimeOfRun = () => {
    const formValues = formMethods.getValues();
    const formKeys = inputParams?.map((param) => `${param.key}:${param.type}`);
    const inputs: Record<string, any> = {};
    formKeys?.map((k) => {
      const key = k.split(':')[0] as string;
      inputs[key] = formValues[k];
    });
    setInputs(inputs);
  };

  return (
    <VStack h="full" w="full">
      {isHandler && (
        <HStack w="full" mb="2">
          <HStack
            color="purple.700"
            px={4}
            py={2}
            rounded="lg"
            justifyContent="space-between"
            border="1px"
            borderColor="gray.200"
            w="full"
          >
            <Text
              fontWeight="semibold"
              fontSize="xs"
              whiteSpace="nowrap"
              flex={1}
            >
              <Link
                href={`${
                  process.env.NODE_ENV === 'development' ? 'http' : 'https'
                }://${appLink}${
                  currentScript?.filename === 'main.ts'
                    ? ''
                    : `/${currentScript?.filename.slice(0, -3)}`
                }`}
                target="_blank"
              >
                {currentScript?.filename === 'main.ts' ? (
                  <>{appLink}</>
                ) : (
                  <>{`${appLink}/${currentScript?.filename.slice(0, -3)}`}</>
                )}
              </Link>
            </Text>
            <Tooltip label="Copy" bgColor="purple.500" textColor="gray.100">
              <IconButton
                aria-label="copy"
                colorScheme="purple"
                variant="ghost"
                size="xs"
                onClick={copyLink}
              >
                <HiOutlineClipboard />
              </IconButton>
            </Tooltip>
          </HStack>
          <Tooltip label={errorTooltip || inputError}>
            <span>
              <Button
                colorScheme="purple"
                variant={
                  currentScript?.filename === 'main.ts' ? 'solid' : 'ghost'
                }
                onClick={() => {
                  setInputsAtTimeOfRun();
                  run(true);
                }}
                display="flex"
                gap={2}
                fontWeight="medium"
                isDisabled={isRunning || !inputParams || editorHasErrors()}
              >
                <HiOutlinePlay />
                <Text>{`Run${
                  currentScript?.filename !== 'main.ts' ? ' this file' : ''
                }`}</Text>
              </Button>
            </span>
          </Tooltip>
        </HStack>
      )}

      {isLibrary && (
        <Box
          p={4}
          backgroundColor="gray.100"
          position="relative"
          rounded="md"
          border="1px"
          borderColor="gray.200"
        >
          <Heading size="sm" mb="4">
            Library file
          </Heading>

          <Text mb={4}>
            This file isn't runnable and won't be mapped to a route because it
            doesn't export a handler function. You can use it to encapsulate
            reusable functionality or to better organize your code.
          </Text>
        </Box>
      )}

      <Tabs
        colorScheme="purple"
        index={tabIndex}
        onChange={handleTabsChange}
        display="flex"
        flexDirection="column"
        h="full"
        w="full"
        hidden={isLibrary}
      >
        <TabList
          border="none"
          borderBottom="1px solid"
          borderColor={'gray.100'}
          color="gray.500"
          gap={4}
          justifyContent="space-between"
          pb={4}
        >
          <HStack spacing={2}>
            {showInputForm && <TabButton title="Preview" />}
            {tips && <TabButton title="Tips" />}
            <TabButton
              title="Console"
              badge={unreadLogs > 0 ? unreadLogs : undefined}
            />
          </HStack>
        </TabList>
        <TabPanels
          as={Flex}
          flexDirection="column"
          h="full"
          // IDK why we need this but it works
          maxH="calc(100% - 115px)"
        >
          {/* INPUT */}
          {showInputForm && (
            <TabPanel
              p={0}
              pt={4}
              h="full"
              display="flex"
              flexDir="column"
              flex="1 1 auto"
              overflow="auto"
              w="full"
            >
              <AppEditSidebarApplet
                appSlug={appSlug}
                inputValuesAtRun={inputs}
              />
            </TabPanel>
          )}

          {/* TIPS */}
          {tips && <TabPanel flex={1}>{tips}</TabPanel>}

          {/* LOGS */}
          <TabPanel
            h="full"
            w="full"
            flex="1 1 auto"
            overflow="auto"
            p={0}
            background="white"
          >
            <AppConsole logs={logs} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};
