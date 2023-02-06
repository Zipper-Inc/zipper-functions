import {
  Box,
  GridItem,
  HStack,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import debounce from 'lodash.debounce';

import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import SecretsTab from '~/components/app/secrets-tab';
import SchedulesTab from '~/components/app/schedules-tab';
import ShareModal from '~/components/app/share-modal';
import useInterval from '~/hooks/use-interval';
import usePrettier from '~/hooks/use-prettier';
import { InputParam, InputType, JSONEditorInputTypes } from '@zipper/types';
import { safeJSONParse } from '~/utils/safe-json';
import { trpc } from '~/utils/trpc';
import {
  useMutation as useLiveMutation,
  useStorage as useLiveStorage,
} from '~/liveblocks.config';
import { LiveObject, LsonObject } from '@liveblocks/client';

import { parseInputForTypes } from '~/utils/parse-input-for-types';
import SettingsModal from './settings-modal';

import DefaultGrid from '../default-grid';
import { PlaygroundHeader } from './playground-header';
import { CodeTab } from './code-tab';
import { useUser } from '@clerk/nextjs';
import { EditorContext } from '../context/editorContext';

const debouncedParseInputForTypes = debounce(
  (code, setInputParams) => setInputParams(parseInputForTypes(code)),
  500,
);

export function Playground({
  app,
  filename = 'main.ts',
}: {
  app: any;
  filename: string;
}) {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const utils = trpc.useContext();

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id }]);
    },
  });

  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [lastRunVersion, setLastRunVersion] = React.useState<string>();
  const [inputValues, setInputValues] = React.useState<Record<string, string>>(
    {},
  );
  const [tabIndex, setTabIndex] = useState(0);

  const inputParamsFormMethods = useForm();

  const [isSettingsModalOpen, setSettingModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const { id } = app;

  const {
    setCurrentScript,
    currentScript,
    save,
    isUserAnAppEditor,
    setIsUserAnAppEditor,
  } = useContext(EditorContext);

  const appEventsQuery = trpc.useQuery([
    'appEvent.all',
    { deploymentId: `${id}@${lastRunVersion}` },
  ]);

  const mainScript = app.scripts.find(
    (script: any) => script.id === app.scriptMain?.scriptId,
  );

  useEffect(() => {
    setCurrentScript(
      app.scripts.find((script: any) => script.filename === filename) ||
        mainScript,
    );
  }, []);

  const mutateLive = useLiveMutation(
    ({ storage }, newCode: string) => {
      const storedScript = storage.get(
        `script-${currentScript?.id}`,
      ) as LiveObject<LsonObject>;

      if (storedScript) {
        storedScript.set('code', newCode);
      }

      debouncedParseInputForTypes(newCode, setInputParams);
    },
    [currentScript],
  );

  const currentScriptLive: any = useLiveStorage(
    (root) => root[`script-${currentScript?.id}`],
  );

  useEffect(() => {
    setInputParams(
      parseInputForTypes(currentScript?.code || currentScriptLive?.code),
    );
  }, [currentScript]);

  useEffect(() => {
    setIsUserAnAppEditor(
      !!app.editors.find((editor: any) => editor.userId === user?.id) || false,
    );
  }, [app, isLoaded]);

  useInterval(async () => {
    if (lastRunVersion) {
      appEventsQuery.refetch();
    }
  }, 10000);

  const format = usePrettier();

  const forkApp = trpc.useMutation('app.fork', {
    async onSuccess(data: any) {
      router.push(`/app/${data.id}/edit`);
    },
  });

  const saveApp = async () => {
    if (currentScriptLive) {
      const formatted = format(currentScriptLive.code).formatted;
      mutateLive(formatted);
    }
    save();
  };

  const getAppDataVersion = () => {
    return new Date(app.updatedAt || Date.now()).getTime().toString();
  };

  const runApp = async () => {
    await saveApp();

    const formValues = inputParamsFormMethods.getValues();
    const inputs: Record<string, any> = {};

    // We need to filter the form values since `useForm` hook keeps these around
    const formKeys = inputParams.map(({ key, type }) => `${key}:${type}`);

    Object.keys(formValues)
      .filter((k) => formKeys.includes(k))
      .forEach((k) => {
        const [inputKey, type] = k.split(':');

        const value = JSONEditorInputTypes.includes(type as InputType)
          ? safeJSONParse(
              formValues[k],
              undefined,
              type === InputType.array ? [] : {},
            )
          : formValues[k];
        inputs[inputKey as string] = value;
      });

    setInputValues(inputs);

    const version = getAppDataVersion();
    setLastRunVersion(version);
    editAppMutation.mutateAsync({
      id,
      data: { lastDeploymentVersion: version },
    });

    // Go directly to code page
    setTabIndex(0);

    // refetch logs
    appEventsQuery.refetch();
  };

  return (
    <Tabs
      colorScheme="purple"
      index={tabIndex}
      onChange={(index) => setTabIndex(index)}
      paddingX={10}
    >
      <PlaygroundHeader
        app={app}
        onClickSettings={() => setSettingModalOpen(true)}
        onClickShare={() => setShareModalOpen(true)}
        onClickRun={runApp}
        onClickFork={() => {
          if (isUserAnAppEditor) return;
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

        {/* SCHEDULES */}
        {isUserAnAppEditor && <Tab>Schedules</Tab>}

        {/* SECRETS */}
        <Tab>Secrets</Tab>
      </TabList>
      {/* TAB PANELS */}
      <TabPanels as={DefaultGrid} maxW="full">
        {/* CODE */}
        <TabPanel as={GridItem} colSpan={12} px={0} pb={0}>
          <CodeTab
            app={app}
            mainScript={mainScript}
            mutateLive={mutateLive}
            inputParamsFormMethods={inputParamsFormMethods}
            inputParams={inputParams}
            inputValues={inputValues}
            appEventsQuery={appEventsQuery}
            lastRunVersion={lastRunVersion}
          />
        </TabPanel>

        {/* SCHEDULES */}
        <TabPanel as={GridItem} colSpan={12}>
          <SchedulesTab inputParams={inputParams} appId={id} />
        </TabPanel>

        {/* SECRETS */}
        <TabPanel as={GridItem} colSpan={12}>
          <SecretsTab editable={isUserAnAppEditor} appId={id} />
        </TabPanel>
      </TabPanels>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        appId={id}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingModalOpen(false)}
        appId={id}
      />
    </Tabs>
  );
}
