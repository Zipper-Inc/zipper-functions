import { Box, FormControl, GridItem, Text, Code } from '@chakra-ui/react';
import React, { useState } from 'react';
import { AppEditSidebar } from '~/components/app/app-edit-sidebar';
import { useCmdOrCtrl } from '~/hooks/use-cmd-or-ctrl';
import { InputParam } from '~/types/input-params';
import DefaultGrid from '../default-grid';
import { ConnectorForm } from './connector-form';
import { PlaygroundSidebar } from './playground-sidebar';
import dynamic from 'next/dynamic';

export const PlaygroundEditor = dynamic(() => import('./playground-editor'), {
  ssr: false,
});

const ConnectorSidebarTips = (connectorId?: string) => {
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
  saveApp,
  isUserAnAppEditor,
  currentScript,
  mainScript,
  currentScriptLive,
  mutateLive,
  inputParamsFormMethods,
  inputParams,
  inputValues,
  appEventsQuery,
  lastRunVersion,
}: {
  app: any;
  saveApp: () => void;
  isUserAnAppEditor: boolean;
  currentScript: any;
  mainScript: any;
  currentScriptLive: any;
  mutateLive: (newCode: string) => void;
  inputParamsFormMethods: any;
  inputParams: InputParam[];
  inputValues: Record<string, string>;
  appEventsQuery: any;
  lastRunVersion: string | undefined;
}) {
  useCmdOrCtrl(
    'S',
    (e: Event) => {
      e.preventDefault();
      saveApp();
    },
    [],
  );
  const [currentScriptId, setCurrentScriptId] = useState(
    currentScriptLive?.id || currentScript.id,
  );

  return (
    <DefaultGrid
      maxW="full"
      px="none"
      overflow="hidden"
      maxHeight={MAX_CODE_TAB_HEIGHT}
    >
      <GridItem colSpan={2}>
        <PlaygroundSidebar
          app={app}
          isUserAnAppEditor={isUserAnAppEditor}
          currentScriptId={currentScriptId}
          mainScript={mainScript}
          setCurrentScriptId={setCurrentScriptId}
        />
      </GridItem>
      <GridItem colSpan={6}>
        <Box width="100%">
          {currentScript.connectorId ? (
            <ConnectorForm type={currentScript.connectorId} appId={app.id} />
          ) : (
            <FormControl>
              <Box style={{ color: 'transparent' }}>
                {PlaygroundEditor && (
                  <PlaygroundEditor
                    height={MAX_CODE_TAB_HEIGHT}
                    key={currentScript?.id}
                    onChange={(value = '') => {
                      mutateLive(value);
                    }}
                    currentScriptId={currentScriptId}
                    scripts={app.scripts}
                    appName={app.slug}
                  />
                )}
              </Box>
            </FormControl>
          )}
        </Box>
      </GridItem>
      <GridItem colSpan={4}>
        <AppEditSidebar
          showInputForm={!currentScript.connectorId}
          inputParamsFormMethods={inputParamsFormMethods}
          inputParams={inputParams}
          inputValues={inputValues}
          appEventsQuery={appEventsQuery}
          appInfo={{
            slug: app.slug,
            version: lastRunVersion,
          }}
          tips={ConnectorSidebarTips(currentScript.connectorId)}
          maxHeight={MAX_CODE_TAB_HEIGHT}
        />
      </GridItem>
    </DefaultGrid>
  );
}
