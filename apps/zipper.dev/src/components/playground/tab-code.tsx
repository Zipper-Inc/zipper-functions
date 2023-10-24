import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import {
  Button,
  Code,
  FormControl,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Script } from '@prisma/client';
import { Markdown, useCmdOrCtrl } from '@zipper/ui';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import { FiEye } from 'react-icons/fi';
import {
  AppEditSidebarContextType,
  AppEditSidebarProvider,
} from '~/components/context/app-edit-sidebar-context';
import {
  useHelpBorder,
  useHelpMode,
} from '~/components/context/help-mode-context';
import { AppEditSidebar } from '~/components/playground/app-edit-sidebar';
import { ConnectorId } from '~/connectors/createConnector';
import { AppQueryOutput } from '~/types/trpc';
import { getOrCreateScriptModel } from '~/utils/playground.utils';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { ConnectorForm } from './connector-form';
import { PlaygroundSidebar } from './playground-sidebar';

export const PlaygroundEditor = dynamic(() => import('./playground-editor'), {
  ssr: false,
});

const ConnectorSidebarTips = (connectorId?: string | null) => {
  if (!connectorId) return undefined;
  return (
    <>
      <Text>
        Import and use the configured client in other files by doing the
        following:
      </Text>
      <Code my="5">import client from './{connectorId}-connector' </Code>
      <Text>Available methods:</Text>
    </>
  );
};

/**
 * @todo
 * figure this out nicely
 * fine to hardcode for now
 */
const APPROXIMATE_HEADER_HEIGHT_PX = '160px';
const MAX_CODE_TAB_HEIGHT = `calc(100vh - ${APPROXIMATE_HEADER_HEIGHT_PX})`;

type CodeTabProps = {
  app: AppQueryOutput;
  mainScript: Script;
  helpMode?: boolean;
};

export const CodeTab: React.FC<CodeTabProps> = ({ app, mainScript }) => {
  const { currentScript, onChange, onValidate, monacoRef } = useEditorContext();
  const { isRunning, run, boot } = useRunAppContext();
  const [expandedResult, setExpandedResult] = useState<
    AppEditSidebarContextType['expandedResult']
  >({});

  const [inputs, setInputs] = useState<AppEditSidebarContextType['inputs']>({});
  const [isMarkdownEditable, setIsMarkdownEditable] = useState(false);
  const toast = useToast();

  const { hoveredElement } = useHelpMode();
  const { style, onMouseEnter, onMouseLeave } = useHelpBorder();

  useCmdOrCtrl(
    'S',
    async (e: Event) => {
      e.preventDefault();
      try {
        await boot({ shouldSave: true });
      } catch (e: any) {
        toast({
          title: 'There was an error while saving',
          description: 'Check the console for errors.',
          status: 'error',
          duration: 3 * 1000,
          isClosable: true,
        });
      }
    },
    [],
  );

  useCmdOrCtrl(
    'Enter',
    (e: Event) => {
      e.preventDefault();
      setExpandedResult({});
      if (!isRunning) {
        run({ shouldSave: true });
      }
    },
    [],
  );

  const currentScriptConnectorId = currentScript?.connectorId;

  const isMarkdown = currentScript?.filename.endsWith('.md');
  const model =
    currentScript && monacoRef?.current
      ? getOrCreateScriptModel(currentScript, monacoRef.current)
      : undefined;

  return (
    <>
      <HStack
        justify="space-between"
        display={{ base: 'flex', xl: 'none' }}
        mb={10}
      >
        <Menu>
          {({ isOpen }) => (
            <>
              <MenuButton
                as={Button}
                variant="ghost"
                colorScheme="purple"
                rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
              >
                {currentScript?.filename}
              </MenuButton>
              <MenuList p={0}>
                <PlaygroundSidebar app={app} mainScript={mainScript} />
              </MenuList>
            </>
          )}
        </Menu>

        <Menu>
          {({ isOpen }) => (
            <>
              <MenuButton
                as={Button}
                fontWeight="medium"
                variant="ghost"
                display={{ base: 'flex', lg: 'none' }}
                colorScheme="purple"
                leftIcon={<FiEye />}
              >
                Preview
              </MenuButton>
              <MenuList p={0} width="320px">
                <AppEditSidebarProvider
                  value={{
                    expandedResult,
                    setExpandedResult,
                    inputs,
                    setInputs,
                  }}
                >
                  <AppEditSidebar
                    appSlug={app.slug}
                    isMarkdownEditable={isMarkdownEditable}
                    setIsMarkdownEditable={setIsMarkdownEditable}
                  />
                </AppEditSidebarProvider>
              </MenuList>
            </>
          )}
        </Menu>
      </HStack>
      <HStack
        flex={1}
        h="full"
        p="none"
        pl="1"
        spacing={0}
        alignItems="stretch"
        pb={3}
        maxH={app.canUserEdit ? MAX_CODE_TAB_HEIGHT : MAX_CODE_TAB_HEIGHT + 50}
        minH="350px"
        overflow="hidden"
      >
        <VStack
          flex={1}
          alignItems="stretch"
          minWidth="250px"
          display={{ base: 'none', xl: 'flex' }}
          maxH="400px"
          minH="fit-content"
          mt={1}
        >
          <PlaygroundSidebar app={app} mainScript={mainScript} />
        </VStack>
        <VStack
          flex={3}
          alignItems="stretch"
          spacing={0}
          minW="sm"
          w="full"
          overflow="auto"
          onMouseEnter={onMouseEnter('PlaygroundCode')}
          onMouseLeave={onMouseLeave}
          border={
            hoveredElement === 'PlaygroundCode'
              ? style('PlaygroundCode').border
              : '4px solid transparent'
          }
        >
          {isMarkdown && !isMarkdownEditable && (
            <VStack
              h="full"
              w="full"
              align="stretch"
              px="10"
              overflowY="scroll"
              scrollBehavior="smooth"
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              <Markdown
                children={model?.getValue() || currentScript?.code || ''}
              />
            </VStack>
          )}

          {currentScriptConnectorId && (
            <ConnectorForm
              connectorId={currentScriptConnectorId as ConnectorId}
              appId={app.id}
            />
          )}
          <FormControl
            flex={1}
            as={VStack}
            alignItems="stretch"
            pt={currentScriptConnectorId ? 4 : 0}
            minH={currentScriptConnectorId ? '50%' : '100%'}
            display={!isMarkdown || isMarkdownEditable ? 'flex' : 'none'}
            pr={{ base: 0, lg: 2 }}
          >
            {PlaygroundEditor && (
              <PlaygroundEditor
                key={app.id}
                onChange={onChange}
                onValidate={onValidate}
                appName={app.slug}
              />
            )}
          </FormControl>
        </VStack>
        <VStack display={{ base: 'none', lg: 'flex' }} flex={2} minW="220px">
          <AppEditSidebarProvider
            value={{
              expandedResult,
              setExpandedResult,
              inputs,
              setInputs,
            }}
          >
            <AppEditSidebar
              appSlug={app.slug}
              isMarkdownEditable={isMarkdownEditable}
              setIsMarkdownEditable={setIsMarkdownEditable}
              canUserEdit={app.canUserEdit}
            />
          </AppEditSidebarProvider>
        </VStack>
      </HStack>
    </>
  );
};
