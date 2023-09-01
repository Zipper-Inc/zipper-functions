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
  getDefaultInputValuesFromConfig,
  getInputValuesFromUrl,
  getRunValues,
} from '../utils/get-input-values-from-url';
import { useRouter } from 'next/router';
import {
  getInputsFromFormData,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  ZIPPER_TEMP_USER_ID_HEADER,
} from '@zipper/utils';
import Unauthorized from './unauthorized';
import removeAppConnectorUserAuth from '~/utils/remove-app-connector-user-auth';
import Header from './header';
import { OpenGraph } from './open-graph';
import InputSummary from './input-summary';
import ConnectorsAuthInputsSection from './connectors-auth-inputs-section';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';
import { getBootUrl, getRelayUrl } from '~/utils/get-relay-url';
import { getZipperAuth } from '~/utils/get-zipper-auth';
import { deleteCookie } from 'cookies-next';
import { getShortRunId } from '~/utils/run-id';
import Error from 'next/error';

const { __DEBUG__ } = process.env;

type Screen = 'initial' | 'output';

const RUN_PATH_NAME = '/run/[[...versionAndFilename]]';

export type AppPageProps = {
  isEmbedded?: boolean;
  shouldShowDescription?: boolean;
  app?: AppInfo;
  inputs: InputParams;
  userAuthConnectors: UserAuthConnector[];
  version?: string;
  filename?: string;
  defaultValues?: Record<string, any>;
  slackAuthUrl?: string;
  githubAuthUrl?: string;
  errorCode?: string;
  entryPoint?: EntryPointInfo;
  result?: string;
  runnableScripts?: string[];
  metadata?: Record<string, string | undefined>;
  handlerConfigs?: Record<string, Zipper.HandlerConfig>;
  token?: string;
  runUrl?: string;
};

export function AppPage({
  isEmbedded,
  shouldShowDescription = true,
  app,
  inputs,
  userAuthConnectors,
  version = 'latest',
  filename,
  defaultValues,
  slackAuthUrl,
  githubAuthUrl,
  errorCode,
  entryPoint,
  result: paramResult,
  runnableScripts,
  metadata,
  handlerConfigs,
  token,
  runUrl,
}: AppPageProps) {
  const router = useRouter();
  const { asPath } = router;
  const appTitle = app?.name || app?.slug || 'Zipper';
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState(paramResult);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>(
    paramResult ? 'output' : 'initial',
  );
  const [latestRunId] = useState<string | undefined>(metadata?.runId);
  const [expandInputsSection, setExpandInputsSection] = useState(false);
  const [currentFileConfig, setCurrentFileConfig] = useState<
    Zipper.HandlerConfig | undefined
  >();

  const [skipAuth, setSkipAuth] = useState(false);

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
      router.pathname !== RUN_PATH_NAME &&
      asPath !== previousRouteRef.current
    ) {
      setScreen('initial');
      const defaultValues = getInputValuesFromUrl({ inputs, url: asPath });
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
    const embedPath = isEmbedded ? 'embed/' : '';
    if (!loading) {
      setLoading(true);
      const rawValues = formContext.getValues();
      const values = getInputsFromFormData(rawValues, inputs);
      if (version !== 'latest') {
        router.push({
          pathname: `/run/${embedPath}${filename}/@${version}`,
          query: values,
        });
      } else {
        router.push({
          pathname: `/run/${embedPath}${filename}`,
          query: values,
        });
      }
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
          if (token) {
            await removeAppConnectorUserAuth({
              appId,
              type: 'github',
              token,
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
          if (token) {
            await removeAppConnectorUserAuth({
              appId,
              type: 'slack',
              token,
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
        showTabs={false}
        generateUserToken={() => {
          return token;
        }}
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

  if (errorCode === 'UNAUTHORIZED') {
    return <Unauthorized />;
  }

  if (errorCode === 'INVALID_VERSION') {
    return <Error statusCode={404} title={'App not published yet'} />;
  }

  if (errorCode === 'NOT_FOUND' || !app) {
    return <Error statusCode={404} />;
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
          <Heading as="h2" fontSize="lg" fontWeight="semibold" color="fg.600">
            {subtitle}
          </Heading>
        )}
      </VStack>
    );
  };

  const initialContent = (
    <>
      <ConnectorsAuthInputsSection
        isCollapsible={false}
        expandByDefault={expandInputsSection}
        toggleIsExpanded={setExpandInputsSection}
        userAuthProps={{
          actions: connectorActions(app.id),
          appTitle,
          userAuthConnectors,
          setSkipAuth,
          skipAuth,
        }}
        userInputsProps={{
          isLoading: loading,
          canRunApp,
          formContext,
          hasResult: false,
          inputs,
          runApp,
          skipAuth,
        }}
      />
    </>
  );

  const inputSummary = (
    <InputSummary
      inputs={inputs}
      formContext={formContext}
      onEditAndRerun={async () => {
        const query = router.query;
        delete query.versionAndFilename;

        await router.push({
          pathname: `/${filename}`,
          query,
        });
        setScreen('initial');
      }}
    />
  );

  const runContent = (
    <VStack w="full" align="stretch" spacing={6}>
      {!isEmbedded && inputSummary}
      {output}
    </VStack>
  );

  const loadingContent = (
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
  );

  const content = (
    <VStack as="main" flex={1} spacing={4} position="relative" px={10}>
      {shouldShowDescription && appletDescription()}
      {screen === 'initial' && initialContent}
      {showRunOutput && runContent}
      {loading && loadingContent}
    </VStack>
  );

  if (isEmbedded) return content;

  return (
    <>
      <Head>
        <title>{appTitle}</title>
        <OpenGraph
          title={appTitle}
          description={app.description || app.slug}
          url={runUrl}
          image={
            result && latestRunId && process.env.NODE_ENV === 'production'
              ? `https://api.urlbox.io/v1/yp9laCbg58Haq8m1/png?url=https://${app.slug}.zipper.run/run/history/${latestRunId}thumb_width=600`
              : undefined
          }
        />
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
        {content}
      </VStack>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
  resolvedUrl,
}) => {
  console.log({ url: req.url, resolvedUrl, query });

  const { host } = req.headers;
  const isEmbedUrl = /\/embed\//.test(resolvedUrl);
  const isRunUrl = /^\/run(\/|\?|$)/.test(resolvedUrl);
  const isInitialServerSideProps = !req.url?.startsWith('/_next');

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
    return { props: { errorCode: appInfoResult.error } };
  }

  const {
    app,
    inputs: inputParams,
    userAuthConnectors,
    entryPoint,
    runnableScripts,
  } = appInfoResult.data;

  const metadata = appInfoResult.data.metadata || {};

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
    [ZIPPER_TEMP_USER_ID_HEADER]:
      req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME] || '',
  };

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

  if (payload === 'UNAUTHORIZED' || payload === 'INVALID_VERSION')
    return { props: { errorCode: payload } };

  const { configs: handlerConfigs } = JSON.parse(payload) as Zipper.BootPayload;

  const config = handlerConfigs[filename];

  const urlValues = getInputValuesFromUrl({
    inputs: inputParams,
    query,
    url: req.url,
  });

  const isAutoRun = config?.run && !isRunUrl && isInitialServerSideProps;
  const isRunPathMissing = isRunUrl && !query.versionAndFilename;
  const shouldRedirect = isAutoRun || isRunPathMissing;

  if (shouldRedirect) {
    const runUrl = new URL(resolvedUrl || '', bootUrl);
    runUrl.pathname = `/run/${filename}`;

    if (isAutoRun) {
      const runValues = getRunValues({ inputParams, url: req.url, config });

      // Add default and run values to the run url before redirecting
      Object.entries(runValues).forEach(([inputName, inputValue]) => {
        runUrl.searchParams.set(
          inputName,
          typeof inputValue === 'string'
            ? inputValue
            : JSON.stringify(inputValue),
        );
      });
    }

    return {
      redirect: {
        destination: runUrl.toString(),
        permanent: false,
      },
    };
  }

  let hideRun = false;
  let result = null;

  if (isRunUrl) {
    // now that we're on a run URL, run it!
    const inputs = getRunValues({ inputParams, url: req.url, query });

    result = await fetch(
      getRelayUrl({
        slug: app.slug,
        path: Array.isArray(query.versionAndFilename)
          ? query.versionAndFilename.join('/')
          : query.versionAndFilename,
      }),
      {
        method: 'POST',
        headers,
        body: JSON.stringify(inputs),
        credentials: 'include',
      },
    )
      .then((r) => {
        const runId = r.headers.get('x-zipper-run-id');
        if (runId) {
          metadata.runId = getShortRunId(runId);
        }
        return r.text();
      })
      .catch((e) => {
        console.log(e);
        return { ok: false, error: e.message };
      });

    hideRun = true;
  }

  const defaultValues = {
    ...getDefaultInputValuesFromConfig(inputParams, config),
    ...urlValues,
  };

  if (__DEBUG__) console.log({ defaultValues });

  inputParams.forEach((i) => {
    const inputConfig = config?.inputs?.[i.key];
    if (inputConfig?.label) i.label = inputConfig.label;
    if (inputConfig?.placeholder) i.placeholder = inputConfig.placeholder;
    if (inputConfig?.description) i.description = inputConfig.description;
  });

  const propsToReturn = {
    props: {
      isEmbedded: isEmbedUrl,
      shouldShowDescription: !(isEmbedUrl && isRunUrl),
      app,
      inputs: inputParams,
      version,
      defaultValues: isRunUrl ? urlValues : defaultValues,
      userAuthConnectors,
      entryPoint,
      runnableScripts,
      metadata,
      filename,
      handlerConfigs,
      hideRun,
      result,
      token: req.headers['x-zipper-access-token'] || null,
      key: resolvedUrl,
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
