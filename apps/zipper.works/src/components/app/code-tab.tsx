import { FormControl, Text, Code, HStack, VStack } from '@chakra-ui/react';
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
const APPROXIMATE_HEADER_HEIGHT_PX = '120px';
const MAX_CODE_TAB_HEIGHT = `calc(100vh - ${APPROXIMATE_HEADER_HEIGHT_PX})`;

type CodeTabProps = {
  app: AppQueryOutput;
  mainScript: Script;
};

export const CodeTab: React.FC<CodeTabProps> = ({ app, mainScript }) => {
  const { currentScript, save, onChange } = useEditorContext();
  const { run } = useRunAppContext();

  useCmdOrCtrl(
    'S',
    (e: Event) => {
      e.preventDefault();
      save();
    },
    [],
  );

  useCmdOrCtrl(
    'Enter',
    (e: Event) => {
      e.preventDefault();
      run();
    },
    [],
  );

  const currentScriptConnectorId = currentScript?.connectorId;

  return (
    <HStack
      flex={1}
      p="none"
      spacing={0}
      alignItems="stretch"
      pb={3}
      maxH={MAX_CODE_TAB_HEIGHT}
      minH="350px"
    >
      <VStack flex={1} alignItems="stretch" minWidth="200px">
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
      <VStack flex={2} alignItems="stretch" minW="220px">
        <AppEditSidebar
          showInputForm={!currentScriptConnectorId}
          tips={ConnectorSidebarTips(currentScriptConnectorId)}
          appSlug={app.slug}
        />
      </VStack>
    </HStack>
  );
};
