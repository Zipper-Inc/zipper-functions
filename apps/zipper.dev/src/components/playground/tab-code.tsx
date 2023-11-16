import { ChevronDownIcon, ChevronUpIcon } from '@chakra-ui/icons';
import {
  Button,
  Code,
  FormControl,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  Text,
  useBreakpoint,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { Script } from '@prisma/client';
import { Markdown, useCmdOrCtrl } from '@zipper/ui';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
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
import { useUser } from '~/hooks/use-user';
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

type CodeTabProps = {
  app: AppQueryOutput;
  mainScript: Script;
  helpMode?: boolean;
};

export const CodeTab: React.FC<CodeTabProps> = ({ app, mainScript }) => {
  const ref = useRef<HTMLDivElement>(null);
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
  const { user } = useUser();

  // Even though we don't return anything here
  // This hook will force a re-render when the breakpoint changes
  // Which causes this height to be recalculated
  useBreakpoint();
  const calculatedHeight = ref.current
    ? `calc(100vh - ${ref.current.getBoundingClientRect().top}px)`
    : '100%';

  useEffect(() => {
    window.document.body.style.overflow = 'hidden';
    window.document.body.style.height = '100vh';
    return () => {
      window.document.body.style.overflow = 'initial';
      window.document.body.style.height = '100%';
    };
  }, [currentScript]);

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
  const getMarkdownBody = () => {
    if (currentScript && monacoRef?.current) {
      const model = getOrCreateScriptModel(currentScript, monacoRef.current);
      if (model) return model.getValue();
    }
    return currentScript?.code || '';
  };

  return (
    <>
      <HStack
        justify="space-between"
        display={{ base: 'flex', xl: 'none' }}
        mb={10}
        data-tab-code="menu"
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
              <MenuList p={0} width="420px">
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
        justify="stretch"
        spacing={0}
        align="stretch"
        h="full"
        w="full"
        data-tab-code="body"
        height={calculatedHeight}
        ref={ref}
      >
        <VStack
          flex={1}
          alignItems="stretch"
          minWidth="250px"
          display={{ base: 'none', xl: 'flex' }}
          maxH="420px"
          minH="fit-content"
        >
          <PlaygroundSidebar app={app} mainScript={mainScript} />
        </VStack>
        <VStack
          flex={3}
          align="stretch"
          justify="stretch"
          minW="sm"
          w="full"
          spacing={0}
          onMouseEnter={onMouseEnter('PlaygroundCode')}
          onMouseLeave={onMouseLeave}
          border={
            hoveredElement === 'PlaygroundCode'
              ? style('PlaygroundCode').border
              : 'none'
          }
        >
          {isMarkdown && !isMarkdownEditable && (
            <VStack
              h="full"
              w="full"
              align="stretch"
              px="10"
              pb="16"
              overflowY="scroll"
              scrollBehavior="smooth"
              css={{
                '&::-webkit-scrollbar': {
                  display: 'none',
                },
              }}
            >
              <Markdown
                children={getMarkdownBody()}
                appInfo={{ name: app.name || app.slug, slug: app.slug }}
                currentUser={{
                  username: user?.username || 'Anonymous',
                }}
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
                appName={app.slug}
              />
            )}
          </FormControl>
        </VStack>
        <VStack
          display={{ base: 'none', lg: 'flex' }}
          flex={2}
          minW="220px"
          position="relative"
          h="full"
          w="full"
        >
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
