import {
  GridItem,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Progress,
  VStack,
  Text,
  ChakraProps,
  Button,
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
import { PlaygroundHeader } from './playground-header';
import { CodeTab } from './code-tab';
import { useUser } from '@clerk/nextjs';
import { useEditorContext } from '../context/editor-context';
import { Script } from '@prisma/client';
import { AppQueryOutput } from '~/types/trpc';
import { RunAppProvider } from '../context/run-app-context';
import { PlaygroundAvatars } from './playground-avatars';
import { useAppEditors } from '~/hooks/use-app-editors';
import { HiOutlineUpload } from 'react-icons/hi';

const tabStyles: ChakraProps = {
  px: 6,
  py: 3,
  rounded: 'md',
  _selected: {
    backgroundColor: 'purple.50',
    fontWeight: 'bold',
    textColor: 'purple.700',
    _hover: { transform: 'none' },
  },
  _hover: {
    backgroundColor: 'purple.50',
    textColor: 'purple.700',
    transform: 'scale(1.05)',
  },
};

export function Playground({
  app,
  filename = 'main.ts',
}: {
  app: AppQueryOutput;
  filename: string;
}) {
  const { user } = useUser();
  const router = useRouter();
  const { editorIds, onlineEditorIds, selfId } = useAppEditors();

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
      <VStack flex={1} paddingX={10} alignItems="stretch" spacing={0}>
        <PlaygroundHeader
          app={app}
          onClickFork={() => {
            if (app.canUserEdit) return;
            if (user) {
              forkApp.mutateAsync({ id: app.id });
            } else {
              router.push(`/sign-in?redirect=${window.location.pathname}`);
            }
          }}
        />
        <Tabs
          colorScheme="purple"
          index={tabIndex}
          onChange={(index) => setTabIndex(index)}
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="start"
        >
          <TabList
            border="none"
            mt={3}
            color="gray.500"
            gap={4}
            justifyContent="space-between"
          >
            <HStack spacing={2}>
              {/* CODE */}
              <Tab {...tabStyles}>
                <Text>Code</Text>
              </Tab>
              {app.canUserEdit && (
                <>
                  {/* SCHEDULES */}
                  <Tab {...tabStyles}>Schedules</Tab>
                  {/* SECRETS */}
                  <Tab {...tabStyles}>Secrets</Tab>
                  {/* SETTINGS */}
                  <Tab {...tabStyles}>Settings</Tab>
                </>
              )}
            </HStack>
            <HStack justifySelf="start">
              {app.canUserEdit && (
                <Button
                  colorScheme="purple"
                  variant="ghost"
                  onClick={() => setShareModalOpen(true)}
                  display="flex"
                  gap={2}
                  fontWeight="medium"
                >
                  <HiOutlineUpload />
                  <Text>Share</Text>
                </Button>
              )}
              <PlaygroundAvatars
                editorIds={editorIds}
                onlineEditorIds={onlineEditorIds}
                selfId={selfId}
              />
            </HStack>
          </TabList>
          {/* TAB PANELS */}
          <TabPanels as={VStack} alignItems="stretch" flex={1}>
            {/* CODE */}
            <TabPanel p={0} pt={9} position="relative" flex={1}>
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
            {app.canUserEdit && (
              <TabPanel as={GridItem} colSpan={12}>
                <SettingsTab app={app} />
              </TabPanel>
            )}
          </TabPanels>

          <ShareModal
            isOpen={isShareModalOpen}
            onClose={() => setShareModalOpen(false)}
            appId={id}
          />
        </Tabs>
      </VStack>
    </RunAppProvider>
  );
}
