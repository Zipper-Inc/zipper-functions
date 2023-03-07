import { Box, FormControl, GridItem, Text, Code } from '@chakra-ui/react';
import { AppEditSidebar } from '~/components/app/app-edit-sidebar';
import { useCmdOrCtrl } from '@zipper/ui';
import DefaultGrid from '../default-grid';
import { ConnectorForm } from './connector-form';
import { PlaygroundSidebar } from './playground-sidebar';
import dynamic from 'next/dynamic';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { ConnectorId } from '~/connectors/createConnector';
import { AppQueryOutput } from '~/types/trpc';

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

export function CodeTab({
  app,
  mainScript,
}: {
  app: AppQueryOutput;
  mainScript: any;
}) {
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

  return (
    <DefaultGrid
      maxW="full"
      px="none"
      overflow="hidden"
      maxHeight={MAX_CODE_TAB_HEIGHT}
    >
      <GridItem colSpan={2}>
        <PlaygroundSidebar app={app} mainScript={mainScript} />
      </GridItem>
      <GridItem colSpan={6}>
        <Box width="100%">
          <>
            {currentScript?.connectorId && (
              <ConnectorForm
                connectorId={currentScript?.connectorId as ConnectorId}
                appId={app.id}
              />
            )}
          </>
          <FormControl>
            <Box style={{ color: 'transparent' }}>
              {PlaygroundEditor && (
                <PlaygroundEditor
                  height={MAX_CODE_TAB_HEIGHT}
                  key={app.id}
                  onChange={onChange}
                  appName={app.slug}
                />
              )}
            </Box>
          </FormControl>
        </Box>
      </GridItem>
      <GridItem colSpan={4}>
        <AppEditSidebar
          showInputForm={!currentScript?.connectorId}
          tips={ConnectorSidebarTips(currentScript?.connectorId)}
          maxHeight={MAX_CODE_TAB_HEIGHT}
        />
      </GridItem>
    </DefaultGrid>
  );
}
