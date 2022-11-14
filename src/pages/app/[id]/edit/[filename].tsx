import {
  Box,
  Button,
  Divider,
  FormControl,
  GridItem,
  HStack,
  Heading,
  Link,
  Text,
  VStack,
  useDisclosure,
} from '@chakra-ui/react';
import NextError from 'next/error';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import dynamic from 'next/dynamic';
import { Script } from '@prisma/client';
import debounce from 'lodash.debounce';

import AddScriptForm from '~/components/edit-app-page/add-script-form';
import DefaultGrid from '~/components/default-grid';
import SecretsModal from '~/components/app/secretsModal';
import { useCmdOrCtrl } from '~/hooks/use-cmd-or-ctrl';
import useInterval from '~/hooks/use-interval';
import usePrettier from '~/hooks/use-prettier';
import { NextPageWithLayout } from '~/pages/_app';
import {
  InputParam,
  InputType,
  JSONEditorInputTypes,
  ParseInputResponse,
} from '~/types/input-params';

import { safeJSONParse } from '~/utils/safe-json';
import { AppEditSidebar } from './app-edit-sidebar';
import { trpc } from '~/utils/trpc';
import ScheduleModal from '~/components/app/scheduleModal';
import AppRunModal from '~/components/app/appRunModal';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

async function parseInput(code?: string): Promise<InputParam[]> {
  const res: ParseInputResponse = await fetch('/api/__/parse-input', {
    method: 'POST',
    body: code || '',
  }).then((r) => r.json());
  return res.params || [];
}

async function changeHandler({
  value,
  scripts,
  currentScript,
  setScripts,
  setInputParams,
}: {
  value?: string;
  scripts: Script[];
  currentScript?: Script;
  setScripts: any;
  setInputParams: any;
}) {
  setScripts(
    scripts.map((script) => {
      if (script.filename === currentScript?.filename) {
        return { ...script, code: value || '' };
      }
      return script;
    }),
  );

  const params = await parseInput(value);
  setInputParams(params);
}

const onCodeChange = debounce(changeHandler, 500);

const AppPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const { query } = useRouter();
  const id = query.id as string;
  const filename = query.filename as string;
  const {
    isOpen: isOpenSecrets,
    onOpen: onOpenSecrets,
    onClose: onCloseSecrets,
  } = useDisclosure();

  const {
    isOpen: isOpenSchedule,
    onOpen: onOpenSchedule,
    onClose: onCloseSchedule,
  } = useDisclosure();

  const {
    isOpen: isOpenAppRun,
    onOpen: onOpenAppRun,
    onClose: onCloseAppRun,
  } = useDisclosure();

  const appQuery = trpc.useQuery(['app.byId', { id }]);

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id }]);
    },
  });

  const addAppRunMutation = trpc.useMutation('appRun.add', {
    async onSuccess() {
      await utils.invalidateQueries(['appRun.all']);
    },
  });

  const [scripts, setScripts] = useState<Script[]>([]);

  const [inputParams, setInputParams] = useState<InputParam[]>([]);
  const [outputValue, setOutputValue] = React.useState('');
  const [lastRunVersion, setLastRunVersion] = React.useState<string>();

  const inputParamsFormMethods = useForm();

  const appEventsQuery = trpc.useQuery([
    'appEvent.all',
    { deploymentId: `${id}@${lastRunVersion}` },
  ]);

  const mainScript = scripts?.find(
    (script) => script.id === appQuery.data?.scriptMain?.scriptId,
  );

  const currentScript =
    scripts?.find((script) => script.filename === filename) || mainScript;

  useEffect(() => {
    setScripts(appQuery.data?.scripts || []);
  }, [appQuery.isSuccess]);

  useEffect(() => {
    parseInput(currentScript?.code).then(setInputParams);
  }, [currentScript]);

  useInterval(async () => {
    if (lastRunVersion) {
      appEventsQuery.refetch();
    }
  }, 10000);

  const format = usePrettier();

  const saveApp = async () => {
    const formatted = scripts.map((script) => {
      if (script.filename !== currentScript?.filename) return script;
      const code = format(script.code).formatted;
      return { ...script, code };
    });

    setScripts(formatted);

    editAppMutation.mutateAsync({
      id,
      data: {
        scripts: formatted.map((script) => {
          return {
            id: script.id,
            data: {
              name: script.name,
              description: script.description || '',
              code: script.code,
            },
          };
        }),
      },
    });
  };

  const getAppDataVersion = () => {
    return new Date(appQuery?.data?.updatedAt || Date.now())
      .getTime()
      .toString();
  };

  const getRunUrl = () => {
    const version = getAppDataVersion();
    setLastRunVersion(version);
    return `/run/${id}@${version}`;
  };

  const runApp = async () => {
    await saveApp();
    const formValues = inputParamsFormMethods.getValues();
    const inputValues: Record<string, any> = {};

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
        inputValues[inputKey as string] = value;
      });

    const raw = await fetch(getRunUrl(), {
      method: 'POST',
      body: JSON.stringify(inputValues),
    });

    const res = await raw.json();
    const result = JSON.stringify(res.data, null, 2);
    setOutputValue(result);

    // refetch logs
    appEventsQuery.refetch();

    addAppRunMutation.mutateAsync({
      appId: id,
      deploymentId: `${id}@${getAppDataVersion()}`,
      inputs: JSON.stringify(inputValues),
      success: res.ok,
      scheduled: false,
      result,
    });
  };

  const shareApp = async () => {
    await saveApp();
    navigator.clipboard.writeText(getRunUrl());
  };

  useCmdOrCtrl(
    'S',
    (e: Event) => {
      e.preventDefault();
      saveApp();
    },
    [scripts],
  );

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (appQuery.status !== 'success') {
    return <>Loading...</>;
  }

  const { data } = appQuery;

  return (
    <>
      <DefaultGrid>
        <GridItem colSpan={7}>
          <HStack gap={2}>
            <Text
              fontWeight={600}
              borderBottom="1px solid"
              borderBottomColor={'purple.600'}
            >
              Code
            </Text>
            <Text>|</Text>
            <Link onClick={onOpenAppRun}>Runs</Link>
            <Link onClick={onOpenSchedule}>Schedules</Link>
            <Link onClick={onOpenSecrets}>Secrets</Link>
          </HStack>
        </GridItem>
        <GridItem colSpan={2} justifyContent="end">
          <HStack>
            <Button onClick={shareApp}>Share</Button>
            <Button onClick={saveApp}>Save</Button>
            <Button
              type="button"
              paddingX={6}
              bgColor="purple.800"
              textColor="gray.100"
              onClick={runApp}
            >
              Run
            </Button>
          </HStack>
        </GridItem>
        <GridItem colSpan={3} />
        <GridItem colSpan={3}>
          <Heading as="h1" size="md" pb={5}>
            {data.name}
          </Heading>
          <VStack alignItems="start" gap={2}>
            {scripts
              .sort((a, b) => {
                let orderA;
                let orderB;

                // always make sure `main` is on top, respect order after
                if (a.id === mainScript?.id) orderA = -Infinity;
                else orderA = a.order === null ? Infinity : a.order;
                if (b.id === mainScript?.id) orderB = -Infinity;
                else orderB = b.order === null ? Infinity : b.order;
                return orderA > orderB ? 1 : -1;
              })
              .map((script, i) => (
                <Fragment key={script.id}>
                  <NextLink
                    href={`/app/${id}/edit/${script.filename}`}
                    passHref
                  >
                    <Link
                      size="sm"
                      background="purple.200"
                      borderRadius={2}
                      px={2}
                    >
                      <b>{script.name}</b>
                    </Link>
                  </NextLink>
                  {i === 0 && (
                    <Text size="sm" color="gray.500">
                      Other functions
                    </Text>
                  )}
                </Fragment>
              ))}
          </VStack>
          <Divider my={5} />
          <AddScriptForm scripts={scripts} appId={id} />
        </GridItem>
        <GridItem colSpan={6}>
          {Editor && (
            <VStack>
              <Box width="100%">
                <FormControl>
                  <Heading as="h2" size="lg">
                    {currentScript?.name || 'Untitled'}
                  </Heading>
                  <Box
                    style={{
                      backgroundColor: '#1e1e1e',
                      height: '100vh',
                      color: '#1e1e1e',
                    }}
                  >
                    <Editor
                      key={currentScript?.filename}
                      defaultLanguage="typescript"
                      height="100vh"
                      value={currentScript?.code || ''}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                      }}
                      onChange={(value) =>
                        onCodeChange({
                          value,
                          scripts,
                          setScripts,
                          currentScript,
                          setInputParams,
                        })
                      }
                    />
                  </Box>
                </FormControl>
              </Box>
            </VStack>
          )}
        </GridItem>
        <GridItem colSpan={3}>
          <AppEditSidebar
            inputParamsFormMethods={inputParamsFormMethods}
            inputParams={inputParams}
            outputValue={outputValue}
            appEventsQuery={appEventsQuery}
          />
        </GridItem>
      </DefaultGrid>
      <SecretsModal
        isOpen={isOpenSecrets}
        onClose={onCloseSecrets}
        appId={id}
      />

      <ScheduleModal
        isOpen={isOpenSchedule}
        onClose={onCloseSchedule}
        inputParams={inputParams}
        appId={id}
      />

      <AppRunModal isOpen={isOpenAppRun} onClose={onCloseAppRun} appId={id} />
    </>
  );
};

export default AppPage;
