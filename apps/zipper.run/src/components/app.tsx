import { useEffect, useMemo, useRef, useState } from 'react';
import {
  withDefaultTheme,
  FunctionOutput,
  useCmdOrCtrl,
  useAppletContent,
} from '@zipper/ui';
import {
  AppInfo,
  EntryPointInfo,
  InputParams,
  UserAuthConnector,
} from '@zipper/types';
import { Heading, Progress, VStack, Divider } from '@chakra-ui/react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import {
  getInputsFromFormData,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import { deleteCookie } from 'cookies-next';
import { useUser } from '@clerk/nextjs';
import Unauthorized from './unauthorized';
import removeAppConnectorUserAuth from '~/utils/remove-app-connector-user-auth';
import Header from './header';
import InputSummary from './input-summary';
import { getShortRunId } from '~/utils/run-id';
import ConnectorsAuthInputsSection from './connectors-auth-inputs-section';

type Screen = 'initial' | 'run' | 'edit';

export type AppPageProps = {
  app?: AppInfo;
  inputs: InputParams;
  userAuthConnectors: UserAuthConnector[];
  version?: string;
  filename?: string;
  defaultValues?: Record<string, any>;
  slackAuthUrl?: string;
  githubAuthUrl?: string;
  statusCode?: number;
  entryPoint?: EntryPointInfo;
  result?: string;
  runnableScripts?: string[];
  metadata?: Record<string, string | undefined>;
};

export function AppPage({
  app,
  inputs,
  userAuthConnectors,
  version = 'latest',
  filename,
  defaultValues,
  slackAuthUrl,
  githubAuthUrl,
  statusCode,
  entryPoint,
  result: paramResult,
  runnableScripts,
  metadata,
}: AppPageProps) {
  const router = useRouter();
  const { asPath } = router;
  const appTitle = app?.name || app?.slug || 'Zipper';
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useUser();
  const [screen, setScreen] = useState<Screen>(paramResult ? 'run' : 'initial');
  const [latestRunId, setLatestRunId] = useState<string>();
  const [expandInputsSection, setExpandInputsSection] = useState(true);
  const [inputValues, setInputValues] = useState<Record<string, any>>({});
  const previousRouteRef = useRef(asPath);

  // We have to do this so that the results aren't SSRed
  // (if they are DOMParser in FunctionOutput will be undefined)
  useEffect(() => {
    if (paramResult) {
      setResult(paramResult);
      setScreen('run');
    }
  }, [paramResult]);

  useEffect(() => {
    if (
      router.pathname !== '/run/[runId]' &&
      asPath !== previousRouteRef.current
    ) {
      setScreen('initial');
      setResult('');
    }
    previousRouteRef.current = asPath;
  }, [asPath]);

  const mainApplet = useAppletContent();

  useEffect(() => {
    mainApplet.expandedContent.set({
      inputs: undefined,
      output: undefined,
    });
    mainApplet.mainContent.set({ inputs, output: result });
  }, [result]);

  const runApp = async () => {
    if (!loading && canRunApp) {
      setLoading(true);
      const rawValues = formContext.getValues();
      const values = getInputsFromFormData(rawValues, inputs);
      setInputValues(values);

      const url = filename ? `/${filename}/call` : '/call';

      const res = await fetch(url, {
        method: 'POST',
        body: JSON.stringify(values),
      });

      const result = await res.text();
      const runId = res.headers.get('x-zipper-run-id');
      if (runId) {
        const shortRunId = getShortRunId(runId);
        setLatestRunId(shortRunId);
        router.push(`/run/${shortRunId}`, undefined, {
          shallow: true,
        });
      }
      if (result) setResult(result);
      setScreen('run');
      setLoading(false);
    }
  };

  useCmdOrCtrl(
    'Enter',
    (e: Event) => {
      e.preventDefault();
      runApp();
    },
    [],
  );

  function getRunUrl(scriptName: string) {
    return `/${scriptName}/call`;
  }

  const connectorActions = (appId: string) => {
    return {
      github: {
        authUrl: githubAuthUrl || '#',
        onDelete: async () => {
          if (user) {
            await removeAppConnectorUserAuth({
              appId,
              type: 'github',
            });
          } else {
            deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
          }
          router.reload();
        },
      },
      slack: {
        authUrl: slackAuthUrl || '#',
        onDelete: async () => {
          if (user) {
            await removeAppConnectorUserAuth({
              appId,
              type: 'slack',
            });
          } else {
            deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
          }
          router.reload();
        },
      },
      openai: {
        authUrl: '#',
        onDelete: async () => {
          if (user) {
            await removeAppConnectorUserAuth({
              appId,
              type: 'openai',
            });
          } else {
            deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
          }
          router.reload();
        },
      },
    };
  };

  const showInput = (['initial', 'edit'] as Screen[]).includes(screen);
  const showRunOutput = (['edit', 'run'] as Screen[]).includes(screen);

  const output = useMemo(() => {
    mainApplet.mainContent.set({
      path: filename,
    });
    if (!app?.slug) return <></>;
    return (
      <FunctionOutput
        applet={mainApplet}
        getRunUrl={(scriptName: string) => {
          return getRunUrl(scriptName);
        }}
        appInfoUrl={`/_zipper/app/info/${app?.slug}`}
        currentContext={'main'}
        appSlug={app.slug}
      />
    );
  }, [mainApplet.updatedAt]);

  const canRunApp = useMemo(() => {
    return (userAuthConnectors || []).every((connector) => {
      return (
        connector.appConnectorUserAuths && connector.appConnectorUserAuths[0]
      );
    });
  }, [userAuthConnectors]);

  if (statusCode === 401 || !app) {
    return <Unauthorized />;
  }

  return (
    <>
      <Head>
        <title>{appTitle}</title>
      </Head>
      <VStack flex={1} alignItems="stretch" spacing={14}>
        <Header
          {...app}
          entryPoint={entryPoint}
          runnableScripts={runnableScripts}
          runId={latestRunId}
        />
        <VStack as="main" flex={1} spacing={4} position="relative" px={10}>
          {showInput && metadata && (
            <VStack mb="10">
              {metadata.h1 && <Heading as="h1">{metadata.h1}</Heading>}
              {metadata.h2 && (
                <Heading
                  as="h2"
                  fontSize="lg"
                  fontWeight="semibold"
                  color="gray.600"
                >
                  {metadata.h2}
                </Heading>
              )}
            </VStack>
          )}
          {showInput && (
            <ConnectorsAuthInputsSection
              isCollapsible={screen === 'edit'}
              expandByDefault={expandInputsSection}
              toggleIsExpanded={setExpandInputsSection}
              userAuthProps={{
                actions: connectorActions(app.id),
                appTitle,
                userAuthConnectors,
              }}
              userInputsProps={{
                canRunApp,
                formContext,
                hasResult: Boolean(result),
                inputs,
                runApp,
              }}
            />
          )}
          {showRunOutput && (
            <VStack w="full" align="stretch" spacing={6}>
              {screen === 'run' && (
                <InputSummary
                  inputs={inputs}
                  formContext={formContext}
                  onEditAndRerun={() => {
                    setScreen('edit');
                  }}
                />
              )}
              <Divider color="gray.300" borderColor="currentcolor" />
              {output}
            </VStack>
          )}
          {loading && (
            <Progress
              colorScheme="purple"
              size="xs"
              isIndeterminate
              width="full"
              position="absolute"
              background="transparent"
              transform="auto"
              translateY={-7}
            />
          )}
        </VStack>
      </VStack>
    </>
  );
}

export default withDefaultTheme(AppPage);
