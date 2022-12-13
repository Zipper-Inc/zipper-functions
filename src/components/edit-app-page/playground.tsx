import {
  Box,
  Button,
  FormControl,
  GridItem,
  HStack,
  Heading,
  Link,
  Text,
  VStack,
  useDisclosure,
  Grid,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Code,
} from '@chakra-ui/react';
import debounce from 'lodash.debounce';
import { AddIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { VscCode, VscTypeHierarchy } from 'react-icons/vsc';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import React, { Fragment, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import AddScriptForm from '~/components/edit-app-page/add-script-form';
import SecretsModal from '~/components/app/secretsModal';
import ScheduleModal from '~/components/app/scheduleModal';
import AppRunModal from '~/components/app/appRunModal';
import ShareModal from '~/components/app/shareModal';
import ForkIcon from '~/components/svg/forkIcon';
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
import { ZipperLogo } from '../svg/zipper-logo';
import { parseInputForTypes } from './parse-input-for-types';
import SettingsModal from '../app/settingsModal';
import { HiLightningBolt, HiOutlineCog, HiOutlineShare } from 'react-icons/hi';
import { connectors } from '~/config/connectors';
import { ConnectorForm } from './connector-form';
import { Script } from '@prisma/client';

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
  const router = useRouter();

  const session = useSessionContext() as SessionContextUpdate & {
    loading: boolean;
  };

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

  const {
    isOpen: isOpenShare,
    onOpen: onOpenShare,
    onClose: onCloseShare,
  } = useDisclosure();

  const {
    isOpen: isOpenSettings,
    onOpen: onOpenSettings,
    onClose: onCloseSettings,
  } = useDisclosure();

  const utils = trpc.useContext();

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id }]);
    },
  });

  const addScript = trpc.useMutation('script.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['script.byAppId', { appId: id }]);
    },
  });

  const addAppConnector = trpc.useMutation('appConnector.add', {
    async onSuccess() {
      // refetches posts after a post is added
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
          <Heading as="h1" size="md" pb={5}>
            <HStack>
              <Box mr={5} height={4}>
                <Link href="/">
                  <ZipperLogo style={{ maxHeight: '100%' }} />
                </Link>
              </Box>
              <Box>
                {app.isPrivate ? (
                  <LockIcon fill={'gray.500'} boxSize={4} mb={1} />
                ) : (
                  <UnlockIcon color={'gray.500'} boxSize={4} mb={1} />
                )}
              </Box>
              {app.parentId && (
                <Box>
                  <Link
                    onClick={() => {
                      if (app.parentId) {
                        router.push(`/app/${app.parentId}/edit`);
                      }
                    }}
                  >
                    <ForkIcon fill={'gray.300'} size={16} />
                  </Link>
                </Box>
              )}
              <Box>{app.slug}</Box>
            </HStack>
          </Heading>
          <HStack gap={2}>
            <Text
              fontWeight={600}
              borderBottom="1px solid"
              borderBottomColor={'purple.600'}
            >
              Code
            </Text>
            <Text>|</Text>
            {isUserAnAppEditor && (
              <>
                <Link onClick={onOpenAppRun}>Runs</Link>
                <Link onClick={onOpenSchedule}>Schedules</Link>
              </>
            )}
            <Link onClick={onOpenSecrets}>Secrets</Link>
          </HStack>
        </GridItem>
        <GridItem colSpan={2} justifyContent="end">
          <HStack justifyContent="end">
            {isUserAnAppEditor && (
              <Button variant={'outline'} onClick={onOpenSettings}>
                <HiOutlineCog />
              </Button>
            )}
            {isUserAnAppEditor && (
              <Button variant={'outline'} onClick={onOpenShare}>
                <HiOutlineShare />
              </Button>
            )}
            {isUserAnAppEditor && (
              <Button
                type="button"
                paddingX={4}
                variant="solid"
                bgColor="purple.800"
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
          <VStack alignItems="start" gap={2}>
            <HStack w="full">
              <VscCode />
              <Text size="sm" color="gray.500" flexGrow={1}>
                Functions
              </Text>
              {isUserAnAppEditor && (
                <Popover>
                  <PopoverTrigger>
                    <Button variant="link">
                      <AddIcon color="gray.500" height={3} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverCloseButton />
                    <PopoverHeader>Add a function</PopoverHeader>
                    <PopoverBody>
                      <AddScriptForm scripts={app.scripts} appId={app.id} />
                    </PopoverBody>
                  </PopoverContent>
                </Popover>
              )}
            </HStack>
            {app.scripts
              .sort((a: any, b: any) => {
                let orderA;
                let orderB;

                // always make sure `main` is on top, respect order after
                if (a.id === mainScript?.id) orderA = -Infinity;
                else orderA = a.order === null ? Infinity : a.order;
                if (b.id === mainScript?.id) orderB = -Infinity;
                else orderB = b.order === null ? Infinity : b.order;
                return orderA > orderB ? 1 : -1;
              })
              .filter((s: Script) => !s.connectorId)
              .map((script: any) => (
                <Fragment key={script.id}>
                  <NextLink
                    href={`/app/${id}/edit/${script.filename}`}
                    passHref
                  >
                    <Link
                      fontSize="sm"
                      fontWeight="light"
                      w="100%"
                      px={2}
                      background={
                        currentScript?.id === script.id
                          ? 'purple.100'
                          : 'transparent'
                      }
                      borderRadius={2}
                    >
                      <b>{script.filename}</b>
                    </Link>
                  </NextLink>
                </Fragment>
              ))}
          </VStack>
          <VStack align="start" gap="2" mt="10">
            <HStack w="full">
              <VscTypeHierarchy />
              <Text size="sm" color="gray.500" flexGrow={1}>
                Connectors
              </Text>
            </HStack>

            {isUserAnAppEditor &&
              connectors.map((connector) => {
                if (!app.connectors.find((c: any) => c.type === connector.id)) {
                  return (
                    <Link
                      key={connector.id}
                      fontSize="sm"
                      onClick={() => {
                        addAppConnector.mutateAsync({
                          appId: app.id,
                          type: connector.id,
                        });

                        addScript.mutateAsync({
                          name: `${connector.id}-connector`,
                          code: connector.code,
                          appId: app.id,
                          order: app.scripts.length + 1,
                          connectorId: connector.id,
                        });
                      }}
                    >
                      + Add {connector.name}
                    </Link>
                  );
                }
              })}

            {app.scripts
              .filter((s: Script) => s.connectorId)
              .map((script: any) => (
                <Fragment key={script.id}>
                  <NextLink
                    href={`/app/${id}/edit/${script.filename}`}
                    passHref
                  >
                    <Link
                      fontSize="sm"
                      fontWeight="light"
                      w="100%"
                      px={2}
                      background={
                        currentScript?.id === script.id
                          ? 'purple.100'
                          : 'transparent'
                      }
                      borderRadius={2}
                    >
                      <b>
                        Configure{' '}
                        {
                          connectors.find((c) => c.id === script.connectorId)
                            ?.name
                        }
                      </b>
                    </Link>
                  </NextLink>
                </Fragment>
              ))}
          </VStack>
        </GridItem>
        <GridItem colSpan={6}>
          <VStack>
            <Box width="100%">
              {currentScript.connectorId ? (
                <ConnectorForm
                  type={currentScript.connectorId}
                  appId={app.id}
                />
              ) : (
                <FormControl>
                  <Box style={{ color: 'transparent' }}>
                    {PlaygroundEditor && (
                      <PlaygroundEditor
                        key={currentScript?.id}
                        value={
                          currentScriptLive?.code || currentScript?.code || ''
                        }
                        onChange={(value = '') => {
                          mutateLive(value);
                        }}
                      />
                    )}
                  </Box>
                </FormControl>
              )}
            </Box>
          </VStack>
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
      <SecretsModal
        isOpen={isOpenSecrets}
        onClose={onCloseSecrets}
        editable={isUserAnAppEditor}
        appId={id}
      />

      <ScheduleModal
        isOpen={isOpenSchedule}
        onClose={onCloseSchedule}
        inputParams={inputParams}
        appId={id}
      />

      <AppRunModal isOpen={isOpenAppRun} onClose={onCloseAppRun} appId={id} />
      <ShareModal isOpen={isOpenShare} onClose={onCloseShare} appId={id} />
      <SettingsModal
        isOpen={isOpenSettings}
        onClose={onCloseSettings}
        appId={id}
      />
    </>
  );
}
