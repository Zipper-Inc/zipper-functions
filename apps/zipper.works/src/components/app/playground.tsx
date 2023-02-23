import {
  Box,
  GridItem,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Progress,
} from '@chakra-ui/react';

import { InputParam } from '@zipper/types';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import SecretsTab from '~/components/app/secrets-tab';
import SchedulesTab from '~/components/app/schedules-tab';
import SettingsTab from './settings-tab';
import ShareModal from '~/components/app/share-modal';
import { trpc } from '~/utils/trpc';

import { parseInputForTypes } from '~/utils/parse-input-for-types';

import DefaultGrid from '../default-grid';
import { PlaygroundHeader } from './playground-header';
import { CodeTab } from './code-tab';
import { useUser } from '@clerk/nextjs';
import { useEditorContext } from '../context/editor-context';
import { Script } from '@prisma/client';
import { AppQueryOutput } from '~/types/trpc';
import { RunAppProvider } from '../context/run-app-context';

export function Playground({
  app,
  filename = 'main.ts',
}: {
  app: AppQueryOutput;
  filename: string;
}) {
  const { user } = useUser();
  const router = useRouter();

  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [tabIndex, setTabIndex] = useState(0);

  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const { id } = app;

  const { setCurrentScript, currentScript, currentScriptLive, save, isSaving } =
    useEditorContext();

  const mainScript = app.scripts.find(
    (script: any) => script.id === app.scriptMain?.scriptId,
  );

  useEffect(() => {
    const initialScript =
      app.scripts.find((script: Script) => script.filename === filename) ||
      mainScript;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setCurrentScript(initialScript!);
  }, []);

  useEffect(() => {
    setInputParams(
      parseInputForTypes(currentScriptLive?.code || currentScript?.code),
    );
  }, [currentScriptLive?.code, currentScript?.code]);

  const forkApp = trpc.useMutation('app.fork', {
    async onSuccess(data: any) {
      router.push(`/app/${data.id}/edit`);
    },
  });

  const switchToCodeTab = () => setTabIndex(0);

  return (
    <RunAppProvider
      app={app}
      inputParams={inputParams}
      onBeforeRun={save}
      onAfterRun={switchToCodeTab}
    >
      <Tabs
        colorScheme="purple"
        index={tabIndex}
        onChange={(index) => setTabIndex(index)}
        paddingX={10}
      >
        <PlaygroundHeader
          app={app}
          onClickShare={() => setShareModalOpen(true)}
          onClickFork={() => {
            if (app.canUserEdit) return;
            if (user) {
              forkApp.mutateAsync({ id: app.id });
            } else {
              router.push(`/sign-in?redirect=${window.location.pathname}`);
            }
          }}
        />

        <TabList
          as={HStack}
          gap={2}
          borderColor={tabIndex === 0 ? 'purple.100' : 'inherit'}
          mt={3}
        >
          {/* CODE */}
          <Tab
            backgroundColor="gray.200"
            borderTopRadius="md"
            _selected={{
              borderColor: 'purple.500',
              backgroundColor: 'purple.500',
              fontWeight: 'bold',
              textColor: 'white',
            }}
          >
            <Box px="2">Code</Box>
          </Tab>

          {app.canUserEdit && (
            <>
              {/* SCHEDULES */}
              <Tab>Schedules</Tab>
              {/* SECRETS */}
              <Tab>Secrets</Tab>
            </>
          )}
          {/* SETTINGS */}
          <Tab>Settings</Tab>
        </TabList>
        {/* TAB PANELS */}
        <TabPanels as={DefaultGrid} maxW="full" p={0}>
          {/* CODE */}
          <TabPanel
            as={GridItem}
            colSpan={12}
            px={0}
            pb={0}
            position="relative"
          >
            {isSaving && (
              <Progress
                isIndeterminate
                colorScheme="purple"
                position="absolute"
                left={0}
                right={0}
                top="-3px"
                height="2px"
                background="transparent"
              />
            )}
            <CodeTab app={app} mainScript={mainScript} />
          </TabPanel>

          {/* SCHEDULES */}
          <TabPanel as={GridItem} colSpan={12}>
            <SchedulesTab inputParams={inputParams} appId={id} />
          </TabPanel>

          {/* SECRETS */}
          <TabPanel as={GridItem} colSpan={12}>
            <SecretsTab editable={app.canUserEdit} appId={id} />
          </TabPanel>

          {/* SETTINGS */}
          <TabPanel as={GridItem} colSpan={12}>
            <SettingsTab app={app} />
          </TabPanel>
        </TabPanels>

        <ShareModal
          isOpen={isShareModalOpen}
          onClose={() => setShareModalOpen(false)}
          appId={id}
        />
      </Tabs>
    </RunAppProvider>
  );
}
