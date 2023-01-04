import {
  Box,
  Button,
  FormControl,
  GridItem,
  HStack,
  Text,
  Grid,
  Code,
} from '@chakra-ui/react';
import debounce from 'lodash.debounce';

import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import PlaygroundSecrets from '~/components/app/playground-secrets';
import PlaygroundSchedule from '~/components/app/playground-schedule';
import PlaygroundRuns from '~/components/app/playground-runs';
import ShareModal from '~/components/app/share-modal';
import { AppEditSidebar } from '~/components/app/app-edit-sidebar';
import { useCmdOrCtrl } from '~/hooks/use-cmd-or-ctrl';
import useInterval from '~/hooks/use-interval';
import usePrettier from '~/hooks/use-prettier';
import {
  InputParam,
  InputType,
  JSONEditorInputTypes,
} from '~/types/input-params';
import { safeJSONParse } from '~/utils/safe-json';
import { trpc } from '~/utils/trpc';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { SessionContextUpdate } from 'supertokens-auth-react/lib/build/recipe/session/types';
import {
  useMutation as useLiveMutation,
  useStorage as useLiveStorage,
} from '~/liveblocks.config';
import { LiveObject, LsonObject } from '@liveblocks/client';
import dynamic from 'next/dynamic';
import { parseInputForTypes } from './parse-input-for-types';
import SettingsModal from '../app/settings-modal';
import { HiLightningBolt, HiOutlineCog, HiOutlineShare } from 'react-icons/hi';

import { ConnectorForm } from './connector-form';
import { PlaygroundSidebar } from './playground-sidebar';
import { PlaygroundHeader } from './playground-header';
import { PlaygroundTab } from '~/types/playground';

const PlaygroundEditor = dynamic(() => import('./playground-editor'), {
  ssr: false,
});

const debouncedParseInputForTypes = debounce(
  (code, setInputParams) => setInputParams(parseInputForTypes(code)),
  500,
);

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

export function Playground({
  app,
  filename = 'main.ts',
}: {
  app: any;
  filename: string;
}) {
  const [currentTab, setCurrentTab] = useState<PlaygroundTab>(
    PlaygroundTab.Code,
  );

  const router = useRouter();

  const session = useSessionContext() as SessionContextUpdate & {
    loading: boolean;
  };

  const utils = trpc.useContext();

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id }]);
    },
  });

  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [lastRunVersion, setLastRunVersion] = React.useState<string>();
  const [isUserAnAppEditor, setIsUserAnAppEditor] = React.useState(false);
  const [inputValues, setInputValues] = React.useState<Record<string, string>>(
    {},
  );

  const inputParamsFormMethods = useForm();

  const [isSettingsModalOpen, setSettingModalOpen] = useState(false);
  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const { id } = app;

  const appEventsQuery = trpc.useQuery([
    'appEvent.all',
    { deploymentId: `${id}@${lastRunVersion}` },
  ]);

  const mainScript = app.scripts.find(
    (script: any) => script.id === app.scriptMain?.scriptId,
  );

  const currentScript =
    app.scripts.find((script: any) => script.filename === filename) ||
    mainScript;

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
    console.log('once effect', currentScript.code, currentScriptLive?.code);
    setInputParams(
      parseInputForTypes(currentScript?.code || currentScriptLive?.code),
    );
  }, []);

  useEffect(() => {
    setIsUserAnAppEditor(
      !!app.editors.find(
        (editor: any) => editor.user.superTokenId === session.userId,
      ) || false,
    );
  }, [app, session.loading]);

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
    const formatted = format(currentScriptLive.code).formatted;
    mutateLive(formatted);

    if (isUserAnAppEditor) {
      editAppMutation.mutateAsync({
        id,
        data: {
          scripts: app.scripts.map((script: any) => ({
            id: script.id,
            data:
              script.id === currentScript.id
                ? {
                    name: currentScriptLive.name || script.name,
                    description:
                      currentScriptLive.description || script.description,
                    code: currentScriptLive.code || script.code,
                  }
                : {
                    name: script.name,
                    description: script.description || '',
                    code: script.code,
                  },
          })),
        },
      });
    }
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

    // refetch logs
    appEventsQuery.refetch();
  };

  useCmdOrCtrl(
    'S',
    (e: Event) => {
      e.preventDefault();
      saveApp();
    },
    [],
  );

  const tabBody = () => {
    switch (currentTab) {
      case PlaygroundTab.Secrets:
        return <PlaygroundSecrets editable={isUserAnAppEditor} appId={id} />;

      case PlaygroundTab.Schedules:
        return <PlaygroundSchedule inputParams={inputParams} appId={id} />;

      case PlaygroundTab.Runs:
        return <PlaygroundRuns appId={id} />;

      default:
      case PlaygroundTab.Code:
        return currentScript.connectorId ? (
          <ConnectorForm type={currentScript.connectorId} appId={app.id} />
        ) : (
          <FormControl>
            <Box style={{ color: 'transparent' }}>
              {PlaygroundEditor && (
                <PlaygroundEditor
                  key={currentScript?.id}
                  value={currentScriptLive?.code || currentScript?.code || ''}
                  onChange={(value = '') => {
                    mutateLive(value);
                  }}
                />
              )}
            </Box>
          </FormControl>
        );
    }
  };

  return (
    <>
      <Grid
        templateColumns="repeat(12, 1fr)"
        gap={4}
        margin="auto"
        w="full"
        paddingX={10}
      >
        <GridItem colSpan={10} mb="5">
          <PlaygroundHeader
            app={app}
            isUserAnAppEditor={isUserAnAppEditor}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
          />
        </GridItem>
        <GridItem colSpan={2} justifyContent="end">
          <HStack justifyContent="end">
            {isUserAnAppEditor && (
              <Button
                variant={'outline'}
                onClick={() => setSettingModalOpen(true)}
              >
                <HiOutlineCog />
              </Button>
            )}
            {isUserAnAppEditor && (
              <Button
                variant={'outline'}
                onClick={() => setShareModalOpen(true)}
              >
                <HiOutlineShare />
              </Button>
            )}
            {isUserAnAppEditor && (
              <Button
                type="button"
                paddingX={4}
                variant="solid"
                bgColor="purple.800"
                _hover={{ bgColor: 'purple.700' }}
                textColor="gray.100"
                onClick={runApp}
              >
                <HiLightningBolt />
                <Text ml="2">Run</Text>
              </Button>
            )}
            {!isUserAnAppEditor && !session.loading && (
              <Button
                type="button"
                paddingX={6}
                variant="outline"
                borderColor="purple.800"
                textColor="purple.800"
                onClick={() => {
                  if (session?.userId) {
                    forkApp.mutateAsync({ id: app.id });
                  } else {
                    router.push(
                      `/auth?redirectToPath=${window.location.pathname}`,
                    );
                  }
                }}
              >
                Fork
              </Button>
            )}
          </HStack>
        </GridItem>
        <GridItem colSpan={2}>
          <PlaygroundSidebar
            app={app}
            isUserAnAppEditor={isUserAnAppEditor}
            currentScript={currentScript}
            mainScript={mainScript}
          />
        </GridItem>
        <GridItem colSpan={6}>
          <Box width="100%">{tabBody()}</Box>
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
          />
        </GridItem>
      </Grid>
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
    </>
  );
}
