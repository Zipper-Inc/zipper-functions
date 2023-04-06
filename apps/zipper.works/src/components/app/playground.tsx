import {
  HStack,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Progress,
  VStack,
  Text,
  Button,
  ChakraProps,
} from '@chakra-ui/react';
import { InputParam } from '@zipper/types';
import React, { useState, useEffect } from 'react';
import SecretsTab from '~/components/app/secrets-tab';
import SchedulesTab from '~/components/app/schedules-tab';
import SettingsTab from './settings-tab';
import ShareModal from '~/components/app/share-modal';
import { parseInputForTypes } from '~/utils/parse-code';
import { PlaygroundHeader } from './playground-header';
import { CodeTab } from './code-tab';
import { useEditorContext } from '../context/editor-context';
import { Script } from '@prisma/client';
import { AppQueryOutput } from '~/types/trpc';
import { RunAppProvider } from '../context/run-app-context';
import { PlaygroundAvatars } from './playground-avatars';
import { useAppEditors } from '~/hooks/use-app-editors';
import { HiOutlineUpload } from 'react-icons/hi';
import { TabButton } from '@zipper/ui';

const tabPanelStyles: ChakraProps = {
  flex: 1,
  p: 0,
  pt: 5,
  display: 'flex',
  flexDirection: 'column',
};

export function Playground({
  app,
  filename = 'main.ts',
}: {
  app: AppQueryOutput;
  filename: string;
}) {
  const { editorIds, onlineEditorIds, selfId } = useAppEditors();

  const [inputParams, setInputParams] = useState<InputParam[] | undefined>([]);
  const [inputError, setInputError] = useState<string | undefined>();
  const [tabIndex, setTabIndex] = useState(0);

  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const { id } = app;

  const { setCurrentScript, currentScript, currentScriptLive, save, isSaving } =
    useEditorContext();

  const mainScript = app.scripts.find(
    (script) => script.id === app.scriptMain?.scriptId,
  ) as Script;

  useEffect(() => {
    const initialScript =
      app.scripts.find((script: Script) => script.filename === filename) ||
      mainScript;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setCurrentScript(initialScript!);
  }, []);

  useEffect(() => {
    try {
      const inputs = parseInputForTypes(
        currentScriptLive?.code || currentScript?.code,
        true,
      );
      setInputParams(inputs);
      setInputError(undefined);
    } catch (e: any) {
      setInputParams(undefined);
      setInputError(e.message);
    }
  }, [currentScriptLive?.code, currentScript?.code]);

  const onAfterRun = async () => {
    setTabIndex(0);
  };

  const onBeforeRun = async () => {
    if (app.canUserEdit) {
      await save();
    }
  };

  return (
    <RunAppProvider
      app={app}
      inputParams={inputParams}
      inputError={inputError}
      onBeforeRun={onBeforeRun}
      onAfterRun={onAfterRun}
    >
      <VStack flex={1} paddingX={10} alignItems="stretch" spacing={0}>
        <PlaygroundHeader app={app} />
        <Tabs
          colorScheme="purple"
          index={tabIndex}
          onChange={(index) => setTabIndex(index)}
          flex={1}
          display="flex"
          flexDirection="column"
          justifyContent="stretch"
          isLazy
        >
          <TabList
            borderBottom="1px solid"
            borderColor={'gray.100'}
            p={1}
            pb={4}
            mb={2}
            pt={3}
            color="gray.500"
            gap={4}
            justifyContent="space-between"
            overflowX="auto"
            hidden={!app.canUserEdit}
          >
            <HStack spacing={2}>
              {/* CODE */}
              <TabButton title="Code" />
              {/* SCHEDULES */}
              <TabButton title="Schedules" />
              {/* SECRETS */}
              <TabButton title="Secrets" />
              {/* SETTINGS */}
              <TabButton title="Settings" />
            </HStack>
            <HStack justifySelf="start">
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
              <PlaygroundAvatars
                editorIds={editorIds}
                onlineEditorIds={onlineEditorIds}
                selfId={selfId}
              />
            </HStack>
          </TabList>
          {/* TAB PANELS */}
          <TabPanels
            as={VStack}
            alignItems="stretch"
            flex={1}
            overflow="auto"
            spacing={0}
          >
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

            {/* SETTINGS */}
            {app.canUserEdit && (
              <TabPanel {...tabPanelStyles}>
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
