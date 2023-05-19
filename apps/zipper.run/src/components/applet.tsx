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
import {
  getInputValuesFromConfig,
  getInputValuesFromUrl,
} from '../utils/get-input-values-from-url';
import { useRouter } from 'next/router';
import {
  getInputsFromFormData,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import { deleteCookie } from 'cookies-next';
import Unauthorized from './unauthorized';
import removeAppConnectorUserAuth from '~/utils/remove-app-connector-user-auth';
import Header from './header';
import InputSummary from './input-summary';
import ConnectorsAuthInputsSection from './connectors-auth-inputs-section';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';
import { getBootUrl } from '~/utils/get-relay-url';
import { getZipperAuth } from '~/utils/get-zipper-auth';

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
  handlerConfigs?: Record<string, Zipper.HandlerConfig>;
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
  handlerConfigs,
}: AppPageProps) {
  const router = useRouter();
  const { asPath } = router;
  const appTitle = app?.name || app?.slug || 'Zipper';
  const formContext = useForm({
    defaultValues,
  });
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>(
    paramResult ? 'output' : 'initial',
  );
  const [latestRunId] = useState<string | undefined>(metadata?.runId);
  const [expandInputsSection, setExpandInputsSection] = useState(false);
  const [currentFileConfig, setCurrentFileConfig] = useState<
    Zipper.HandlerConfig | undefined
  >();
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
    setLoading(false);
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
      path: filename,
    });
  }, [result]);

  useEffect(() => {
    if (handlerConfigs && filename) {
      setCurrentFileConfig(handlerConfigs[filename]);
    }
  }, [handlerConfigs, filename]);

  const runApp = async () => {
    if (!loading && canRunApp) {
      setLoading(true);
      const rawValues = formContext.getValues();
      const values = getInputsFromFormData(rawValues, inputs);
      router.push({ pathname: `/run/${filename}`, query: values });
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
    return `/${scriptName}/relay`;
  }

  const connectorActions = (appId: string) => {
    return {
      github: {
        authUrl: githubAuthUrl || '#',
        onDelete: async () => {
          // if (user) {
          //   await removeAppConnectorUserAuth({
          //     appId,
          //     type: 'github',
          //   });
          // } else {
          //   deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
          // }
          router.reload();
        },
      },
      slack: {
        authUrl: slackAuthUrl || '#',
        onDelete: async () => {
          // if (user) {
          //   await removeAppConnectorUserAuth({
          //     appId,
          //     type: 'slack',
          //   });
          // } else {
          //   deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
          // }
          router.reload();
        },
      },
      openai: {
        authUrl: '#',
        onDelete: async () => {
          // if (user) {
          //   await removeAppConnectorUserAuth({
          //     appId,
          //     type: 'openai',
          //   });
          // } else {
          //   deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
          // }
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
        showTabs={false}
      />
    );
  }, [app, mainApplet.updatedAt]);

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

  const appletDescription = () => {
    if (!currentFileConfig || !currentFileConfig.description) {
      return <></>;
    }

    const { title, subtitle } = currentFileConfig.description;
    if (!title && !subtitle) {
      return <></>;
    }

    return (
      <VStack mb="10">
        {title && <Heading as="h1">{title}</Heading>}
        {subtitle && (
          <Heading as="h2" fontSize="lg" fontWeight="semibold" color="gray.600">
            {subtitle}
          </Heading>
        )}
      </VStack>
    );
  };

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
          setLoading={setLoading}
        />
        <VStack as="main" flex={1} spacing={4} position="relative" px={10}>
          {appletDescription()}
          {screen === 'initial' && (
            <>
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
                  isLoading: loading,
                  canRunApp,
                  formContext,
                  hasResult: false,
                  inputs,
                  runApp,
                }}
              />
            </>
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

  const { version: versionFromUrl, filename: filenameFromUrl } =
    getFilenameAndVersionFromPath(
      ((query.versionAndFilename as string[]) || []).join('/'),
      [],
    );
  if (__DEBUG__) console.log({ versionFromUrl, filename: filenameFromUrl });

  const { token, userId } = await getZipperAuth(req);

  // grab the app if it exists
  const appInfoResult = await getAppInfo({
    subdomain,
    tempUserId: req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
    filename: filenameFromUrl,
    token,
  });

  if (__DEBUG__) console.log('getAppInfo', { result: appInfoResult });
  if (!appInfoResult.ok) {
    if (appInfoResult.error === 'UNAUTHORIZED')
      return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const {
    app,
    inputs,
    userAuthConnectors,
    entryPoint,
    runnableScripts,
    metadata,
  } = appInfoResult.data;

  const version = versionFromUrl || 'latest';
  const filename = filenameFromUrl || 'main.ts';

  // boot it up
  // todo cache this
  const bootUrl = getBootUrl({ slug: appInfoResult.data.app.slug });
  const payload = await fetch(bootUrl, {
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  }).then((r) => r.text());

  if (payload === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
  const { configs: handlerConfigs } = JSON.parse(payload) as Zipper.BootPayload;

  /**
   * @todo not sure if redirect is appropriate but whatever
   */
  if (handlerConfigs[filename]?.run) {
    const runUrl = new URL(req.url || '', bootUrl);
    runUrl.pathname = `/run/${filename}`;
    return {
      redirect: {
        destination: runUrl.toString(),
        permanent: false,
      },
    };
  }

  const defaultValues = {
    ...getInputValuesFromConfig(inputs, handlerConfigs[filename]),
    ...getInputValuesFromUrl(inputs, req.url),
  };

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
      filename,
      handlerConfigs,
    },
  };

  const { githubAuthUrl, slackAuthUrl } = getConnectorsAuthUrl({
    userAuthConnectors,
    userId: userId || (req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME] as string),
    appId: app.id,
    host: req.headers.host,
  });

  return {
    props: { ...propsToReturn.props, slackAuthUrl, githubAuthUrl },
  };
};

export default withDefaultTheme(AppPage);
