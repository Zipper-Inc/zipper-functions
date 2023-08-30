import {
  HStack,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Progress,
  VStack,
  ChakraProps,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import SecretsTab from '~/components/app/secrets-tab';
import SchedulesTab from '~/components/app/schedules-tab';
import SettingsTab from './settings-tab';
import { PlaygroundHeader } from './playground-header';
import { CodeTab } from './code-tab';
import { useEditorContext } from '../context/editor-context';
import { Script } from '@prisma/client';
import { AppQueryOutput } from '~/types/trpc';
import { parsePlaygroundQuery, PlaygroundTab } from '~/utils/playground.utils';
import { RunAppProvider } from '../context/run-app-context';
import { PlaygroundAvatars } from './playground-avatars';
import { useAppEditors } from '~/hooks/use-app-editors';
import { TabButton } from '@zipper/ui';
import HistoryTab from './history-tab';
import VersionsTab from './versions-tab';
import { useRouter } from 'next/router';

const tabPanelStyles: ChakraProps = {
  flex: 1,
  p: 0,
  pt: 5,
  display: 'flex',
  flexDirection: 'column',
};

export function Playground({
  app,
  tab = PlaygroundTab.Code,
  filename = 'main.ts',
}: {
  app: AppQueryOutput;
  tab: PlaygroundTab;
  filename?: string;
}) {
  const { editorIds, onlineEditorIds, selfId } = useAppEditors();

  const [tabIndex, setTabIndex] = useState(
    Object.values(PlaygroundTab).indexOf(tab),
  );

  const { id } = app;

  const {
    setCurrentScript,
    save,
    isSaving,
    addLog,
    setLogStore,
    preserveLogs,
    resourceOwnerSlug,
    appSlug,
  } = useEditorContext();

  const makeHref = (tabToLink: PlaygroundTab = tab) => {
    const parts = [resourceOwnerSlug, appSlug, tabToLink];
    if (tabToLink === PlaygroundTab.Code && filename) parts.push(filename);
    return `/${parts.join('/')}`;
  };

  const mainScript = app.scripts.find(
    (script) => script.id === app.scriptMain?.scriptId,
  ) as Script;

  useEffect(() => {
    const initialScript =
      app.scripts.find((script: Script) => script.filename === filename) ||
      mainScript;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setCurrentScript(initialScript!);
  }, [filename]);

  const router = useRouter();

  useEffect(() => {
    const { tab: currentTab } = parsePlaygroundQuery(router.query);
    setTabIndex(Object.values(PlaygroundTab).indexOf(currentTab));
  }, [router.query]);
  const onAfterRun = async () => {
    setTabIndex(0);
  };

  const saveAppBeforeRun = async () => {
    if (app.canUserEdit) {
      return save();
    } else {
      return app.playgroundVersionHash || app.publishedVersionHash || '';
    }
  };

  console.log('render', {
    tab,
    values: Object.values(PlaygroundTab),
    idx: Object.values(PlaygroundTab).indexOf(tab),
    filename,
  });
  return (
    <RunAppProvider
      app={app}
      saveAppBeforeRun={saveAppBeforeRun}
      addLog={addLog}
      setLogStore={setLogStore}
      onAfterRun={onAfterRun}
      preserveLogs={preserveLogs}
    >
      <VStack flex={1} paddingX={10} alignItems="stretch" spacing={0}>
        <PlaygroundHeader app={app} />
        <Tabs
          colorScheme="purple"
          index={tabIndex}
          onChange={(index) => {
            const href = makeHref(Object.values(PlaygroundTab)[index]);
            router.push(href, undefined, { shallow: true });
          }}
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="stretch"
          isLazy
        >
          <TabList
            borderBottom="1px solid"
            borderColor={'fg.100'}
            p={1}
            pb={4}
            mb={2}
            pt={3}
            color="fg.500"
            gap={2}
            justifyContent="space-between"
            overflowX="auto"
            hidden={!app.canUserEdit}
          >
            <HStack spacing={2} flex={4}>
              {/* CODE */}
              <TabButton title="Code" href={makeHref(PlaygroundTab.Code)} />

              {/* SCHEDULES */}
              <TabButton
                title="Schedules"
                href={makeHref(PlaygroundTab.Schedules)}
              />

              {/* SECRETS */}
              <TabButton
                title="Secrets"
                href={makeHref(PlaygroundTab.Secrets)}
              />

              {/* RUNS */}
              <TabButton title="Runs" href={makeHref(PlaygroundTab.Runs)} />

              {/* VERSIONS */}
              <TabButton
                title="Versions"
                href={makeHref(PlaygroundTab.Versions)}
              />

              {/* SETTINGS */}
              <TabButton
                title="Settings"
                href={makeHref(PlaygroundTab.Settings)}
              />
            </HStack>
            {editorIds.length > 1 && (
              <PlaygroundAvatars
                editorIds={editorIds}
                onlineEditorIds={onlineEditorIds}
                selfId={selfId}
              />
            )}
          </TabList>
          {/* TAB PANELS */}
          <TabPanels as={VStack} alignItems="stretch" h="full" spacing={0}>
            {/* CODE */}
            <TabPanel position="relative" {...tabPanelStyles}>
              {isSaving && (
                <Progress
                  isIndeterminate
                  colorScheme="purple"
                  position="absolute"
                  left={0}
                  right={0}
                  top="0"
                  height="2px"
                  background="transparent"
                />
              )}
              <CodeTab app={app} mainScript={mainScript} />
            </TabPanel>

            {/* SCHEDULES */}
            <TabPanel {...tabPanelStyles}>
              <SchedulesTab appId={id} />
            </TabPanel>

            {/* SECRETS */}
            <TabPanel {...tabPanelStyles}>
              <SecretsTab editable={app.canUserEdit} appId={id} />
            </TabPanel>

            {/* RUNS */}
            <TabPanel {...tabPanelStyles}>
              <HistoryTab appId={id} />
            </TabPanel>

            {/* VERSIONS */}
            <TabPanel {...tabPanelStyles}>
              <VersionsTab appId={id} slug={app.slug} />
            </TabPanel>

            {/* SETTINGS */}
            {app.canUserEdit && (
              <TabPanel {...tabPanelStyles}>
                <SettingsTab app={app} />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </VStack>
    </RunAppProvider>
  );
}
