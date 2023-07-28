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
} from '@chakra-ui/react';
import { TabButton } from '@zipper/ui';
import { useState } from 'react';

import { useEditorContext } from '../context/editor-context';
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
  const [tabIndex, setTabIndex] = useState(0);

  const consoleTabIndex = tips ? 2 : 1;

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
  } = useEditorContext();

  const { colorMode } = useColorMode();

  const unreadLogs = logs.filter(
    (log) => log.timestamp > lastReadLogsTimestamp,
  ).length;

  const isLibrary = !inputParams && !inputError;
  return (
    <VStack h="full" w="full">
      {isLibrary && (
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
              <AppEditSidebarApplet appSlug={appSlug} />
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
            background="bgColor"
          >
            <AppConsole key={colorMode} logs={logs} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};
