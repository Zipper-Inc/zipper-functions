import {
  Box,
  Button,
  Heading,
  HStack,
  Progress,
  Stack,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import {
  AppInfo,
  BootInfoWithUserInfo,
  EntryPointInfo,
  InputParams,
  UserAuthConnector,
  ZipperLocation,
} from '@zipper/types';
import {
  AppletAuthor,
  FunctionOutput,
  useAppletContent,
  useCmdOrCtrl,
  withDefaultTheme,
} from '@zipper/ui';
import {
  getDescription,
  HandlerDescription,
} from '@zipper/ui/src/components/function-output/handler-description';
import {
  getInputsFromFormData,
  getScreenshotUrl,
  NOT_FOUND,
  UNAUTHORIZED,
  __ZIPPER_TEMP_USER_ID,
  X_ZIPPER_TEMP_USER_ID,
  X_ZIPPER_ACCESS_TOKEN,
} from '@zipper/utils';
import { deleteCookie } from 'cookies-next';
import { motion } from 'framer-motion';
import { GetServerSideProps } from 'next';
import Error from 'next/error';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { HiChevronDoubleLeft, HiChevronDoubleRight } from 'react-icons/hi2';
import TimeAgo from 'react-timeago';
import { fetchBootPayloadCachedWithUserInfoOrThrow } from '~/utils/get-boot-info';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';
import { getRelayUrl } from '~/utils/get-relay-url';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import { getZipperAuth } from '~/utils/get-zipper-auth';
import removeAppConnectorUserAuth from '~/utils/remove-app-connector-user-auth';
import { getShortRunId } from '~/utils/run-id';
import {
  getDefaultInputValuesFromConfig,
  getInputValuesFromUrl,
  getRunValues,
} from '../utils/get-input-values-from-url';
import ConnectorsAuthInputsSection from './connectors-auth-inputs-section';
import Header from './header';
import InputSummary from './input-summary';
import Unauthorized from './unauthorized';

const { __DEBUG__ } = process.env;

type Screen = 'initial' | 'output';

const RUN_PATH_NAME = '/run/[[...versionAndFilename]]';

export type AppPageProps = {
  isEmbedded?: boolean;
  shouldShowChrome?: boolean;
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
  softRedirect?: string | null;
  resultOnly?: boolean;
};

export function AppPage({
  isEmbedded,
  shouldShowChrome = true,
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
  result: resultPassedIn,
  runnableScripts,
  metadata,
  handlerConfigs,
  token,
  runUrl,
  softRedirect,
  resultOnly,
}: AppPageProps) {
  const router = useRouter();
  const { asPath } = router;
  const appTitle = app?.name || app?.slug || 'Zipper';
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState(resultPassedIn);
  const [loading, setLoading] = useState(false);
  const [screen, setScreen] = useState<Screen>(
    resultPassedIn ? 'output' : 'initial',
  );
  const [latestRunId] = useState<string | undefined>(metadata?.runId);
  const [expandInputsSection, setExpandInputsSection] = useState(false);
  const [currentFileConfig, setCurrentFileConfig] = useState<
    Zipper.HandlerConfig | undefined
  >(filename ? handlerConfigs?.[filename] : undefined);

  const [skipAuth, setSkipAuth] = useState(false);

  const showRunOutput = (['output'] as Screen[]).includes(screen);

  const { isOpen, onToggle, onClose } = useDisclosure({
    defaultIsOpen: !isEmbedded,
  });

  const variants = {
    open: { opacity: 1, x: 0 },
    closed: { opacity: 0, x: '-100%' },
  };

  const description = getDescription({
    applet: app,
    filename: entryPoint?.filename,
    config: currentFileConfig,
  });

  const previousRouteRef = useRef(asPath);

  // Perform a soft redirect if we have this prop
  useEffect(() => {
    if (softRedirect) {
      window.history.replaceState({}, '', softRedirect);
    }
  }, []);

  // We have to do this so that the results aren't SSRed
  // (if they are DOMParser in FunctionOutput will be undefined)
  useEffect(() => {
    if (resultPassedIn) {
      setResult(resultPassedIn);
      setScreen('output');
    }
  }, [resultPassedIn]);

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
    if (JSON.stringify(result || {}).length > 100) onClose();
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
          query: JSON.parse(JSON.stringify(values)),
        });
      } else {
        const stringifiedValuesIfObject = Object.entries(values).reduce(
          (acc, [key, value]) => {
            acc[key] =
              typeof value === 'object'
                ? JSON.stringify(value)
                : (value as string | number | boolean);
            return acc;
          },
          {} as Record<string, string | number | boolean>,
        );
        router.push({
          pathname: `/run/${embedPath}${filename}`,
          query: stringifiedValuesIfObject,
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
            deleteCookie(__ZIPPER_TEMP_USER_ID);
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
            deleteCookie(__ZIPPER_TEMP_USER_ID);
          }
          router.reload();
        },
      },
      discord: {
        authUrl: slackAuthUrl || '#',
        onDelete: async () => {
          if (token) {
            await removeAppConnectorUserAuth({
              appId,
              type: 'discord',
              token,
            });
          } else {
            deleteCookie(__ZIPPER_TEMP_USER_ID);
          }
          router.reload();
        },
      },
    };
  };

  const output = useMemo(() => {
    if (!app?.slug) return <></>;
    return (
      <FunctionOutput
        applet={mainApplet}
        config={currentFileConfig}
        getRunUrl={(scriptName: string) => {
          return getRunUrl(scriptName);
        }}
        appInfoUrl={`/_zipper/bootInfo/${app?.slug}`}
        currentContext={'main'}
        appSlug={app.slug}
        showTabs={false}
        generateUserToken={() => {
          return token;
        }}
      />
    );
  }, [app, mainApplet.updatedAt, currentFileConfig]);

  const canRunApp = useMemo(() => {
    return (userAuthConnectors || []).every((connector) => {
      return (
        connector.appConnectorUserAuths && connector.appConnectorUserAuths[0]
      );
    });
  }, [userAuthConnectors]);

  if (errorCode === UNAUTHORIZED) {
    return <Unauthorized />;
  }

  if (errorCode === 'INVALID_VERSION') {
    return <Error statusCode={404} title={'App not published yet'} />;
  }

  if (errorCode === NOT_FOUND || !app) {
    return <Error statusCode={404} />;
  }
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
          pathname: isEmbedded ? `/embed/${filename}` : `/${filename}`,
          query,
        });
        setScreen('initial');
      }}
    />
  );

  const title = description?.title || appTitle || app?.slug;
  const runContent = (
    <VStack w="full" align="stretch" spacing={4} ml={{ md: 4 }}>
      {<Box ml="4">{inputSummary}</Box>}
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    <Stack
      as="main"
      position="relative"
      w="full"
      h="full"
      px={{ base: 4, md: 8 }}
      pt={0}
      mt={isEmbedded ? 4 : 0}
    >
      {title && (
        <Heading
          as="h1"
          fontSize="4xl"
          fontWeight="medium"
          borderBottomColor="gray.50"
          borderBottomWidth="1px"
          pb={2}
        >
          {title}
        </Heading>
      )}
      <HStack align="center" alignItems="start" pb={2}>
        <Button
          px={0}
          variant="ghost"
          colorScheme="purple"
          size="sm"
          fontWeight="normal"
          leftIcon={
            isOpen ? (
              <HiChevronDoubleLeft size={12} />
            ) : (
              <HiChevronDoubleRight size={12} />
            )
          }
          _hover={{ bgColor: 'transparent' }}
          onClick={onToggle}
        >
          {isOpen ? 'Hide' : 'Show'} App Details
        </Button>

        {showRunOutput && runContent}
      </HStack>
      <Stack
        as="div"
        direction={{ base: 'column', md: 'row' }}
        justify="start"
        pt={4}
        pb={8}
        spacing={8}
        h="full"
      >
        {isOpen ? (
          <VStack
            width={{ base: 'auto', md: '100%' }}
            minW="300px"
            maxW="400px"
            align="stretch"
            flex={2}
            as={motion.div}
            initial="closed"
            animate={isOpen ? 'open' : 'closed'}
            variants={variants}
            maxH="fit-content"
          >
            {app.appAuthor && <AppletAuthor author={app.appAuthor} />}
            <Stack>
              <Text fontSize="xs" color="fg.500">
                <>
                  Last published{' '}
                  <TimeAgo
                    date={app.updatedAt!}
                    formatter={(value, unit, suffix) => {
                      if (unit !== 'second') {
                        return [
                          value,
                          unit + (value !== 1 ? 's' : ''),
                          suffix,
                        ].join(' ');
                      }

                      if (suffix === 'ago') {
                        return 'a few seconds ago';
                      }
                    }}
                  />
                </>
              </Text>
            </Stack>
            <Stack>
              <HandlerDescription
                description={
                  screen === 'initial'
                    ? description
                    : { ...description, title: undefined }
                }
                location={ZipperLocation.ZipperDotRun}
              />
            </Stack>
          </VStack>
        ) : null}

        <VStack mx="auto" align="stretch" flex={3} height="full" w="full">
          {screen === 'initial' && initialContent}

          <VStack alignSelf="start" width="full" height="full">
            {showRunOutput && output}
          </VStack>
          {loading && loadingContent}
        </VStack>
      </Stack>
    </Stack>
  );

  if (isEmbedded) return content;
  if (resultOnly)
    return (
      <div
        className="result"
        style={{
          width: 'fit-content',
          minWidth: '600px',
          minHeight: '600px',
          padding: 2,
        }}
      >
        {output}
      </div>
    );

  const appletUrl = `https://${app.slug}.zipper.run`;

  return (
    <>
      <Head>
        <title>{appTitle}</title>
        <meta
          property="og:image"
          content={
            latestRunId
              ? getScreenshotUrl(`${appletUrl}/run/history/${latestRunId}`)
              : getScreenshotUrl(`${appletUrl}/embed/run/main.ts`)
          }
        />
        <meta name="description" content={app.description || app.slug} />
        <meta property="og:title" content={appTitle} />
        <meta property="og:description" content={app.description || app.slug} />
        <meta property="og:site_name" content="Zipper" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={runUrl || appletUrl} />
      </Head>
      <VStack flex={1} alignItems="stretch" spacing={4}>
        <Header
          {...app}
          token={token}
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
  const host = req.headers['x-zipper-host'] || req.headers.host;
  const isEmbedUrl = /\/embed\//.test(resolvedUrl);
  const isRunUrl = /^\/run(\/|\?|$)/.test(resolvedUrl);
  const isInitialServerSideProps = !req.url?.startsWith('/_next');

  // validate subdomain
  const subdomain = getValidSubdomain(host as string);
  if (__DEBUG__)
    console.log('applet.tsx | getServerSideProps | getValidSubdomain', {
      subdomain,
      host,
    });
  if (!subdomain) return { notFound: true };

  const { version: versionFromUrl, filename: filenameFromUrl } =
    getFilenameAndVersionFromPath(
      ((query.versionAndFilename as string[]) || []).join('/'),
      [],
    );
  if (__DEBUG__)
    console.log('applet.tsx | getServerSideProps', {
      versionFromUrl,
      filename: filenameFromUrl,
      host,
      reqUrl: req.url,
      resolvedUrl,
    });

  const { token, userId } = await getZipperAuth(req);
  const tempUserId = req.cookies[__ZIPPER_TEMP_USER_ID];

  let bootPayload;
  try {
    bootPayload = await fetchBootPayloadCachedWithUserInfoOrThrow({
      subdomain,
      tempUserId,
      version: versionFromUrl,
      filename: filenameFromUrl,
      token,
    });
  } catch (e: any) {
    return {
      props: { errorCode: e?.message || e || 'Error fetching payload' },
    };
  }

  if (!bootPayload) return { notFound: true };

  if (__DEBUG__)
    console.log(
      'applet.tsx | getServerSideProps',
      `bootPayload for ${req.url?.toString()}`,
      bootPayload,
    );

  const { bootInfo } = bootPayload;
  const { app, inputs: inputParams, entryPoint, runnableScripts } = bootInfo;

  const metadata = bootInfo.metadata || {};

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
    [X_ZIPPER_TEMP_USER_ID]: tempUserId || '',
  };

  const version = (versionFromUrl || 'latest').replace(/^@/, '');
  let filename = filenameFromUrl || 'main.ts';
  if (!filename.endsWith('.ts')) filename = `${filename}.ts}`;

  if (!runnableScripts.includes(filename)) return { notFound: true };

  const { configs: handlerConfigs } = bootPayload;

  const config = handlerConfigs && handlerConfigs[filename];

  const urlValues = inputParams
    ? getInputValuesFromUrl({
        inputs: inputParams,
        query,
        url: req.url,
      })
    : {};

  const isAutoRun = config?.run && !isRunUrl && isInitialServerSideProps;
  const isRunPathMissing = isRunUrl && !query.versionAndFilename;
  const shouldRedirect = isAutoRun || isRunPathMissing;

  let softRedirect = null;

  if (shouldRedirect) {
    if (__DEBUG__)
      console.log('shouldRedirect', { isAutoRun, isRunPathMissing });

    const runUrl = new URL(resolvedUrl || '', getRelayUrl({ slug: subdomain }));
    runUrl.pathname = isEmbedUrl
      ? `/run/embed/${filename}`
      : `/run/${filename}`;

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

    softRedirect = runUrl.toString();
  }

  let hideRun = false;
  let result = null;

  if (isAutoRun || isRunUrl) {
    const url = softRedirect || req.url;
    const inputs = getRunValues({
      inputParams,
      url,
      query,
    });

    if (__DEBUG__)
      console.log('applet.tsx | getServerSideProps | isRunUrl', {
        inputParams,
        url,
        query,
        inputs,
      });

    result = await fetch(
      getRelayUrl({
        slug: app.slug,
        path: [version, filename].join('/'),
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

    // Might as well handle any router redirects server side
    // Let's see if this string looks like one before parsing
    if (typeof result === 'string' && result.includes('Zipper.Router')) {
      try {
        const {
          $zipperType,
          redirect,
          notFound,
        }: Zipper.Router.Redirect &
          Zipper.Router.NotFound &
          Zipper.Router.Error = JSON.parse(result);
        if ($zipperType === 'Zipper.Router') {
          if (redirect)
            return { redirect: { destination: redirect, permanent: false } };
          if (notFound) return { notFound };
        }
      } catch (e) {}
    }
  }

  const defaultValues = {
    ...getDefaultInputValuesFromConfig(inputParams, config),
    ...urlValues,
  };

  if (__DEBUG__)
    console.log(
      'applet.tsx | getServerSideProps ',
      'run url default values',
      defaultValues,
    );

  inputParams.forEach((i) => {
    const inputConfig = config?.inputs?.[i.key];
    if (inputConfig?.label) i.label = inputConfig.label;
    if (inputConfig?.placeholder) i.placeholder = inputConfig.placeholder;
    if (inputConfig?.description) i.description = inputConfig.description;
  });

  const propsToReturn = {
    props: {
      isEmbedded: isEmbedUrl,
      shouldShowChrome: !isEmbedUrl,
      app,
      inputs: inputParams,
      version,
      defaultValues: isRunUrl ? urlValues : defaultValues,
      userAuthConnectors:
        (bootInfo as BootInfoWithUserInfo).userAuthConnectors || [],
      entryPoint,
      runnableScripts,
      metadata,
      filename,
      handlerConfigs,
      hideRun,
      result,
      softRedirect,
      token: req.headers[X_ZIPPER_ACCESS_TOKEN] || null,
      key: resolvedUrl,
    },
  };

  const { githubAuthUrl, slackAuthUrl } = getConnectorsAuthUrl({
    userAuthConnectors:
      (bootInfo as BootInfoWithUserInfo).userAuthConnectors || [],
    userId: userId || (req.cookies[__ZIPPER_TEMP_USER_ID] as string),
    appId: app.id,
    host: req.headers.host,
  });

  return {
    props: { ...propsToReturn.props, slackAuthUrl, githubAuthUrl },
  };
};

export default withDefaultTheme(AppPage);
