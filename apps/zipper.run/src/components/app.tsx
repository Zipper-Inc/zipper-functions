import { useEffect, useMemo, useRef, useState } from 'react';
import { GetServerSideProps } from 'next';
import { withDefaultTheme, FunctionOutput, useCmdOrCtrl } from '@zipper/ui';
import {
  AppInfo,
  ConnectorActionProps,
  ConnectorType,
  EntryPointInfo,
  InputParams,
  UserAuthConnector,
} from '@zipper/types';
import getAppInfo from '~/utils/get-app-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import {
  Box,
  Heading,
  Button,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  HStack,
  IconButton,
  VStack,
  Divider,
} from '@chakra-ui/react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { getInputValuesFromUrl } from '../utils/get-input-values-from-url';
import { useRouter } from 'next/router';
import {
  getInputsFromFormData,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import { deleteCookie } from 'cookies-next';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';
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

type Screen = 'initial' | 'run' | 'edit';

export type AppPageProps = {
  app: AppInfo;
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
}: AppPageProps) {
  const router = useRouter();
  const { asPath } = router;
  const appTitle = app?.name || app?.slug || 'Zipper';
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState('');
  const [expandedResult, setExpandedResult] = useState('');
  const [modalResult, setModalResult] = useState({ heading: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const { user } = useUser();
  const [screen, setScreen] = useState<Screen>(paramResult ? 'run' : 'initial');
  const [latestRunId, setLatestRunId] = useState<string>();
  const [expandInputsSection, setExpandInputsSection] = useState(true);
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

  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (modalResult.body) {
      onOpen();
    }
  }, [modalResult]);

  function closeModal() {
    setModalResult({ heading: '', body: '' });
    onClose();
  }

  function getRunUrl(scriptName: string) {
    return `/${scriptName}/call`;
  }

  const secondaryResultComponent = (secondaryResult: any) => {
    return (
      <FunctionOutput
        result={secondaryResult}
        setOverallResult={setResult}
        setModalResult={setModalResult}
        setExpandedResult={setExpandedResult}
        getRunUrl={getRunUrl}
      />
    );
  };

  const connectorActions: Record<ConnectorType, ConnectorActionProps> = {
    github: {
      authUrl: githubAuthUrl || '#',
      onDelete: async () => {
        if (user) {
          await removeAppConnectorUserAuth({
            appId: app.id,
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
            appId: app.id,
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
            appId: app.id,
            type: 'openai',
          });
        } else {
          deleteCookie(ZIPPER_TEMP_USER_ID_COOKIE_NAME);
        }
        router.reload();
      },
    },
  };

  const showInput = (['initial', 'edit'] as Screen[]).includes(screen);
  const showRunOutput = (['edit', 'run'] as Screen[]).includes(screen);

  const canRunApp = useMemo(() => {
    return (userAuthConnectors || []).every((connector) => {
      return (
        connector.appConnectorUserAuths && connector.appConnectorUserAuths[0]
      );
    });
  }, [userAuthConnectors]);

  if (statusCode === 401) {
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
        <VStack
          as="main"
          flex={1}
          spacing={0}
          gap={14}
          position="relative"
          px={10}
        >
          {showInput && (
            <ConnectorsAuthInputsSection
              isCollapsible={screen === 'edit'}
              expandByDefault={expandInputsSection}
              toggleIsExpanded={setExpandInputsSection}
              userAuthProps={{
                actions: connectorActions,
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
              <FunctionOutput
                result={result}
                setOverallResult={setResult}
                setModalResult={setModalResult}
                setExpandedResult={setExpandedResult}
                getRunUrl={getRunUrl}
              />
              {expandedResult && (
                <Box
                  borderLeft={'5px solid'}
                  borderColor={'purple.300'}
                  mt={8}
                  pl={3}
                  mb={4}
                  mx={8}
                >
                  <HStack align={'center'} mt={2}>
                    <Heading flexGrow={1} size="sm" ml={1}>
                      Additional Results
                    </Heading>
                    <IconButton
                      aria-label="hide"
                      icon={
                        isExpandedResultOpen ? (
                          <HiOutlineChevronUp />
                        ) : (
                          <HiOutlineChevronDown />
                        )
                      }
                      onClick={() =>
                        setIsExpandedResultOpen(!isExpandedResultOpen)
                      }
                    />
                  </HStack>
                  {isExpandedResultOpen && (
                    <Box>{secondaryResultComponent(expandedResult)}</Box>
                  )}
                </Box>
              )}
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

      <Modal isOpen={isOpen} onClose={closeModal} size="5xl">
        <ModalOverlay />
        <ModalContent maxH="2xl">
          <ModalHeader>{modalResult.heading || appTitle} </ModalHeader>
          <ModalCloseButton />
          <ModalBody
            fontSize="sm"
            color="neutral.700"
            flex={1}
            display="flex"
            flexDirection="column"
            gap={8}
            overflow="auto"
          >
            {secondaryResultComponent(modalResult.body)}
          </ModalBody>
          <ModalFooter justifyContent="space-between">
            <Button
              variant="outline"
              onClick={closeModal}
              mr="3"
              flex={1}
              fontWeight="medium"
            >
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
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

  const { app, inputs, userAuthConnectors, entryPoint, runnableScripts } =
    result.data;

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
