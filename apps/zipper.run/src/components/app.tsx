import { useEffect, useMemo, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
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
import getAppInfo from '~/utils/get-app-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import { Heading, Progress, VStack } from '@chakra-ui/react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { getInputValuesFromUrl } from '../utils/get-input-values-from-url';
import { useRouter } from 'next/router';
import {
  getInputsFromFormData,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import { deleteCookie } from 'cookies-next';
import { getAuth } from '@clerk/nextjs/server';
import { useUser } from '@clerk/nextjs';
import Unauthorized from './unauthorized';
import removeAppConnectorUserAuth from '~/utils/remove-app-connector-user-auth';
import Header from './header';
import InputSummary from './input-summary';
import { getShortRunId } from '~/utils/run-id';
import ConnectorsAuthInputsSection from './connectors-auth-inputs-section';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';

const { __DEBUG__ } = process.env;

type Screen = 'initial' | 'output';

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
  const [screen, setScreen] = useState<Screen>(
    paramResult ? 'output' : 'initial',
  );
  const [latestRunId, setLatestRunId] = useState<string>();
  const [expandInputsSection, setExpandInputsSection] = useState(false);
  const previousRouteRef = useRef(asPath);

  // We have to do this so that the results aren't SSRed
  // (if they are DOMParser in FunctionOutput will be undefined)
  useEffect(() => {
    if (paramResult) {
      setResult(paramResult);
      setScreen('output');
    }
  }, [paramResult]);

  useEffect(() => {
    if (
      router.pathname !== '/run/[path]' &&
      asPath !== previousRouteRef.current
    ) {
      setScreen('initial');

      const defaultValues = getInputValuesFromUrl(inputs, asPath);
      formContext.reset(defaultValues);
      setResult('');
    }
    previousRouteRef.current = asPath;
  }, [asPath]);

  const mainApplet = useAppletContent();

  useEffect(() => {
    mainApplet.reset();
    const inputParamsWithValues = inputs?.map((i) => {
      if (defaultValues) {
        i.value = defaultValues[`${i.key}:${i.type}`];
      }
      return i;
    });

    mainApplet.mainContent.set({
      inputs,
      output: {
        data: result || '',
        inputsUsed: inputParamsWithValues || [],
      },
    });
  }, [result]);

  const runApp = async () => {
    if (!loading && canRunApp) {
      setLoading(true);
      const rawValues = formContext.getValues();
      const values = getInputsFromFormData(rawValues, inputs);
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
        router.push(
          { pathname: `/run/${filename}`, query: values },
          undefined,
          {
            shallow: true,
          },
        );
      }
      if (result) setResult(result);
      setScreen('output');
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

  const showRunOutput = (['output'] as Screen[]).includes(screen);

  const output = useMemo(() => {
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
          setScreen={setScreen}
        />
        <VStack as="main" flex={1} spacing={4} position="relative" px={10}>
          {metadata && Object.keys(metadata).length > 0 && (
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
          {screen === 'initial' && (
            <ConnectorsAuthInputsSection
              isCollapsible={false}
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
                hasResult: false,
                inputs,
                runApp,
              }}
            />
          )}
          {showRunOutput && (
            <VStack w="full" align="stretch" spacing={6}>
              <InputSummary
                inputs={inputs}
                formContext={formContext}
                onEditAndRerun={() => {
                  const query = router.query;
                  delete query.path;

                  router.push({
                    pathname: `/${filename}`,
                    query,
                  });
                  setScreen('initial');
                }}
              />
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

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  if (__DEBUG__) console.log('getValidSubdomain', { subdomain, host });
  if (!subdomain) return { notFound: true };

  const { version: versionFromUrl, filename } = getFilenameAndVersionFromPath(
    ((query.versionAndFilename as string[]) || []).join('/'),
    [],
  );
  if (__DEBUG__) console.log({ versionFromUrl, filename });

  const auth = getAuth(req);

  // grab the app if it exists
  const result = await getAppInfo({
    subdomain,
    tempUserId: req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
    filename,
    token: await auth.getToken({ template: 'incl_orgs' }),
  });

  if (__DEBUG__) console.log('getAppInfo', { result });
  if (!result.ok) {
    if (result.error === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const {
    app,
    inputs,
    userAuthConnectors,
    entryPoint,
    runnableScripts,
    metadata,
  } = result.data;

  const version = versionFromUrl || 'latest';

  const defaultValues = getInputValuesFromUrl(inputs, req.url);
  if (__DEBUG__) console.log({ defaultValues });

  const propsToReturn = {
    props: {
      app,
      inputs,
      version,
      defaultValues,
      userAuthConnectors,
      entryPoint,
      runnableScripts,
      metadata,
      filename: filename || 'main.ts',
    },
  };

  const { githubAuthUrl, slackAuthUrl } = getConnectorsAuthUrl({
    userAuthConnectors,
    userId:
      auth.userId || (req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME] as string),
    appId: app.id,
    host: req.headers.host,
  });

  return {
    props: { ...propsToReturn.props, slackAuthUrl, githubAuthUrl },
  };
};

export default withDefaultTheme(AppPage);
