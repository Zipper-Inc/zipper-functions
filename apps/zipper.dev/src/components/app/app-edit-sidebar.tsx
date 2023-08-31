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
  Heading,
  useColorMode,
  Button,
} from '@chakra-ui/react';
import { TabButton } from '@zipper/ui';
import { useState } from 'react';
import { useEditorContext } from '../context/editor-context';
import AppEditSidebarApplet from './app-edit-sidebar-applet';
import { AppConsole } from './app-console';
import { HiEye, HiPencil } from 'react-icons/hi2';

type AppEditSidebarProps = {
  appSlug: string;
  isMarkdownEditable: boolean;
  setIsMarkdownEditable: (editable: boolean) => void;
};

export const AppEditSidebar: React.FC<AppEditSidebarProps> = ({
  appSlug,
  isMarkdownEditable,
  setIsMarkdownEditable,
}) => {
  const [tabIndex, setTabIndex] = useState(0);

  const consoleTabIndex = 1;

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
    if (index === consoleTabIndex) {
      markLogsAsRead();
    }
  };

  const {
    inputParams,
    inputError,
    logs,
    markLogsAsRead,
    lastReadLogsTimestamp,
    currentScript,
  } = useEditorContext();

  const { colorMode } = useColorMode();

  const unreadLogs = logs.filter(
    (log) => log.timestamp > new Date(lastReadLogsTimestamp),
  ).length;

  const isLibrary = !inputParams && !inputError;

  const isMarkdown = currentScript?.filename.endsWith('.md');

  return (
    <VStack h="full" w="full">
      {isMarkdown && (
        <Button
          variant="outline"
          alignSelf="start"
          size="sm"
          fontWeight="normal"
          ml={10}
          onClick={() => setIsMarkdownEditable(!isMarkdownEditable)}
        >
          <HStack spacing={2}>
            {isMarkdownEditable ? <HiEye /> : <HiPencil />}
            <Text>{isMarkdownEditable ? 'Preview' : 'Edit'}</Text>
          </HStack>
        </Button>
      )}
      {isLibrary && !isMarkdown && (
        <Box
          p={4}
          backgroundColor="fg.100"
          position="relative"
          rounded="md"
          border="1px"
          borderColor="fg.200"
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
          borderColor={'fg.100'}
          color="fg.500"
          gap={4}
          justifyContent="space-between"
          pb={4}
        >
          <HStack spacing={2}>
            <TabButton title="Preview" />
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
            <AppEditSidebarApplet appSlug={appSlug} />
          </TabPanel>

          {/* LOGS */}
          <TabPanel
            h="full"
            w="full"
            flex="1 1 auto"
            overflow="auto"
            p={0}
            background="bgColor"
          >
            <AppConsole key={colorMode} logs={logs} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};
