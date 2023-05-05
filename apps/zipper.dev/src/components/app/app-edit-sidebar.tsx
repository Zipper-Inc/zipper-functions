import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  VStack,
  Box,
  Text,
  HStack,
  Button,
  Tooltip,
  useToast,
  IconButton,
  Heading,
  useClipboard,
} from '@chakra-ui/react';
import { TabButton } from '@zipper/ui';
import { useEffect, useState } from 'react';
import { LogLine } from '~/components/app/log-line';
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

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const { isRunning, run } = useRunAppContext();

  const { currentScript, inputParams, inputError, logs } = useEditorContext();

  // const { setExpandedResult } = useAppEditSidebarContext();

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

  // const setInputsAtTimeOfRun = () => {
  //   const formValues = formMethods.getValues();
  //   const formKeys = inputParams?.map((param) => `${param.key}:${param.type}`);
  //   const inputs: Record<string, any> = {};
  //   formKeys?.map((k) => {
  //     const key = k.split(':')[0] as string;
  //     inputs[key] = formValues[k];
  //   });
  //   setInputs(inputs);
  // };

  return (
    <VStack align="stretch">
      {isHandler && (
        <HStack w="full" mb="2">
          <HStack
            color="purple.700"
            px={4}
            py={2}
            rounded="lg"
            justifyContent="space-between"
            overflow="auto"
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
                }://${appLink}`}
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
          <Tooltip label={inputError}>
            <span>
              <Button
                colorScheme="purple"
                variant={
                  currentScript?.filename === 'main.ts' ? 'solid' : 'ghost'
                }
                onClick={() => {
                  // setExpandedResult({});
                  // setInputsAtTimeOfRun();
                  run(true);
                }}
                display="flex"
                gap={2}
                fontWeight="medium"
                isDisabled={isRunning || !inputParams}
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
        flex={1}
        display="flex"
        flexDirection="column"
        gap={5}
        alignItems="stretch"
        hidden={isLibrary}
      >
        <TabList
          border="none"
          borderBottom="1px solid"
          borderColor={'gray.100'}
          color="gray.500"
          gap={4}
          justifyContent="space-between"
          overflow="auto"
          pb={4}
        >
          <HStack spacing={2}>
            {showInputForm && <TabButton title="Preview" />}
            {tips && <TabButton title="Tips" />}
            <TabButton title="Console" />
          </HStack>
        </TabList>
        <TabPanels as={VStack} alignItems="stretch" flex={1} spacing="0">
          {/* INPUT */}
          {showInputForm && (
            <TabPanel
              p={0}
              flex={1}
              display="flex"
              flexDir="column"
              alignItems="stretch"
            >
              {/** @todo make this height thing less jank */}
              <AppEditSidebarApplet appSlug={appSlug} />
            </TabPanel>
          )}

          {/* TIPS */}
          {tips && <TabPanel flex={1}>{tips}</TabPanel>}

          {/* LOGS */}
          <TabPanel flex={1} p={0} mt={0}>
            <AppConsole logs={logs} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};
