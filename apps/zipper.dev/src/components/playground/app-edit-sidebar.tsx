import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useBreakpoint,
  useColorMode,
  VStack,
} from '@chakra-ui/react';
import { TabButton } from '@zipper/ui';
import { useRef, useState } from 'react';
import { HiEye, HiPencil } from 'react-icons/hi2';
import { useEditorContext } from '../context/editor-context';
import { useHelpBorder, useHelpMode } from '../context/help-mode-context';
import { AppConsole } from './app-console';
import AppEditSidebarApplet from './app-edit-sidebar-applet';

type AppEditSidebarProps = {
  appSlug: string;
  isMarkdownEditable: boolean;
  setIsMarkdownEditable: (editable: boolean) => void;
  canUserEdit?: boolean;
};

enum AppEditSidebarMode {
  Handler,
  Library,
  Markdown,
  Empty,
}

const useAppEditSidebarMode = () => {
  const { inputParams, inputError, currentScript } = useEditorContext();

  if (currentScript?.filename.endsWith('.md')) {
    return AppEditSidebarMode.Markdown;
  }

  if (!inputParams && !inputError) {
    return AppEditSidebarMode.Library;
  }

  if (currentScript) return AppEditSidebarMode.Handler;

  return AppEditSidebarMode.Empty;
};

export const AppEditSidebar: React.FC<AppEditSidebarProps> = ({
  appSlug,
  isMarkdownEditable,
  setIsMarkdownEditable,
  canUserEdit,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const consoleTabIndex = 1;

  // Even though we don't return anything
  // This hook will force a re-render when the breakpoint changes
  // Which causes this height to be recalculated
  useBreakpoint();
  const calculatedHeight = ref?.current
    ? `calc(100vh - ${ref.current.getBoundingClientRect().top}px)`
    : '100vh';

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
    if (index === consoleTabIndex) {
      markLogsAsRead();
    }
  };

  const { logs, markLogsAsRead, lastReadLogsTimestamp } = useEditorContext();

  const { colorMode } = useColorMode();

  const unreadLogs = logs.filter(
    (log) => log.timestamp > new Date(lastReadLogsTimestamp),
  ).length;

  const mode = useAppEditSidebarMode();

  const { style, onMouseEnter, onMouseLeave } = useHelpBorder();
  const { hoveredElement } = useHelpMode();

  return (
    <VStack
      position={{ base: 'initial', lg: 'absolute' }}
      p={{ base: 2, lg: 0 }}
      inset={0}
      backgroundColor="bgColor"
      h={calculatedHeight}
      w="full"
      onMouseEnter={onMouseEnter('PreviewPanel')}
      onMouseLeave={onMouseLeave()}
      border={
        hoveredElement === 'PreviewPanel'
          ? style('PreviewPanel').border
          : '4px solid transparent'
      }
      data-app-edit-sidebar
      ref={ref}
    >
      {mode === AppEditSidebarMode.Markdown && canUserEdit && (
        <Button
          variant="outline"
          alignSelf="start"
          size="sm"
          fontWeight="normal"
          ml={4}
          onClick={() => setIsMarkdownEditable(!isMarkdownEditable)}
        >
          <HStack spacing={2}>
            {isMarkdownEditable ? <HiEye /> : <HiPencil />}
            <Text>{isMarkdownEditable ? 'Preview' : 'Edit'}</Text>
          </HStack>
        </Button>
      )}

      {mode === AppEditSidebarMode.Library && (
        <Box
          p={4}
          backgroundColor="fg.100"
          position="relative"
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

      {mode === AppEditSidebarMode.Handler && (
        <Tabs
          colorScheme="purple"
          index={tabIndex}
          onChange={handleTabsChange}
          display="flex"
          flexDirection="column"
          h="full"
          w="full"
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
              <div onMouseEnter={onMouseEnter('PreviewPanel')}>
                <TabButton title="Preview" />
              </div>
              <div onMouseEnter={onMouseEnter('ConsoleTab')}>
                <TabButton
                  title="Console"
                  badge={unreadLogs > 0 ? unreadLogs : undefined}
                />
              </div>
            </HStack>
          </TabList>
          <TabPanels as={Flex} flexDirection="column" h="full" w="full">
            {/* INPUT */}

            <TabPanel
              p={0}
              pt={4}
              pb={20}
              display="flex"
              flexDir="column"
              overflow="auto"
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
      )}
    </VStack>
  );
};
