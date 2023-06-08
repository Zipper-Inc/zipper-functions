import {
  FormControl,
  Text,
  Code,
  HStack,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { AppEditSidebar } from '~/components/app/app-edit-sidebar';
import { useCmdOrCtrl } from '@zipper/ui';
import { ConnectorForm } from './connector-form';
import { PlaygroundSidebar } from './playground-sidebar';
import dynamic from 'next/dynamic';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { ConnectorId } from '~/connectors/createConnector';
import { AppQueryOutput } from '~/types/trpc';
import { Script } from '@prisma/client';
import { useState } from 'react';
import {
  AppEditSidebarContextType,
  AppEditSidebarProvider,
} from '~/components/context/app-edit-sidebar-context';

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
const APPROXIMATE_HEADER_HEIGHT_PX = '175px';
const MAX_CODE_TAB_HEIGHT = `calc(100vh - ${APPROXIMATE_HEADER_HEIGHT_PX})`;

type CodeTabProps = {
  app: AppQueryOutput;
  mainScript: Script;
};

export const CodeTab: React.FC<CodeTabProps> = ({ app, mainScript }) => {
  const { currentScript, onChange, onValidate } = useEditorContext();
  const { isRunning, run, boot: saveAndBoot } = useRunAppContext();
  const [expandedResult, setExpandedResult] = useState<
    AppEditSidebarContextType['expandedResult']
  >({});

  const [inputs, setInputs] = useState<AppEditSidebarContextType['inputs']>({});
  const toast = useToast();

  useCmdOrCtrl(
    'S',
    async (e: Event) => {
      e.preventDefault();
      try {
        await saveAndBoot();
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
        run();
      }
    },
    [],
  );

  const currentScriptConnectorId = currentScript?.connectorId;

  return (
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
        maxH="400px"
        minH="fit-content"
      >
        <PlaygroundSidebar app={app} mainScript={mainScript} />
      </VStack>
      <VStack
        flex={3}
        alignItems="stretch"
        spacing={0}
        minW="sm"
        overflow="auto"
      >
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
          pr={2}
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
      <VStack flex={2} minW="220px">
        <AppEditSidebarProvider
          value={{
            expandedResult,
            setExpandedResult,
            inputs,
            setInputs,
          }}
        >
          <AppEditSidebar
            showInputForm={!currentScriptConnectorId}
            tips={ConnectorSidebarTips(currentScriptConnectorId)}
            appSlug={app.slug}
          />
        </AppEditSidebarProvider>
      </VStack>
    </HStack>
  );
};
