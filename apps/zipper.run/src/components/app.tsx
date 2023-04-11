import { useEffect, useMemo, useState } from 'react';
import { GetServerSideProps } from 'next';
import {
  FunctionInputs,
  withDefaultTheme,
  ZipperLogo,
  FunctionOutput,
  useCmdOrCtrl,
  FunctionUserConnectors,
} from '@zipper/ui';
import {
  AppInfo,
  ConnectorActionProps,
  ConnectorType,
  InputParams,
  UserAuthConnector,
} from '@zipper/types';
import getAppInfo from '~/utils/get-app-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';
import {
  Box,
  Heading,
  Flex,
  Text,
  ButtonGroup,
  Button,
  Divider,
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
} from '@chakra-ui/react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { getInputValuesFromUrl } from '../utils/get-input-values-from-url';
import { useRouter } from 'next/router';
import { encryptToHex } from '@zipper/utils';
import { deleteCookie } from 'cookies-next';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';

import { getAuth } from '@clerk/nextjs/server';
import { UserButton, useUser } from '@clerk/nextjs';
import Unauthorized from './unauthorized';
import removeAppConnectorUserAuth from '~/utils/remove-app-connector-user-auth';
import Header from './header';
import AuthUserConnectors from './user-connectors';
import UserInputs from './user-inputs';

const { __DEBUG__ } = process.env;

type Screen = 'initial' | 'run' | 'edit';

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
  editUrl,
}: {
  app: AppInfo;
  inputs: InputParams;
  userAuthConnectors: UserAuthConnector[];
  version?: string;
  filename?: string;
  defaultValues?: Record<string, any>;
  slackAuthUrl?: string;
  githubAuthUrl?: string;
  statusCode?: number;
  editUrl?: string;
}) {
  const router = useRouter();
  const appTitle = app?.name || app?.slug || 'Zipper';
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState('');
  const [expandedResult, setExpandedResult] = useState('');
  const [modalResult, setModalResult] = useState({ heading: '', body: '' });
  const [loading, setLoading] = useState(false);
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const { user } = useUser();
  const [screen, setScreen] = useState<Screen>('initial');

  const runApp = async () => {
    setLoading(true);
    const rawValues = formContext.getValues();
    const values: Record<string, any> = {};
    Object.keys(rawValues).forEach((k) => {
      const parts = k.split(':');
      parts.pop();
      const key = parts.join(':');
      values[key] = rawValues[k];
    });

    const url = filename ? `/${filename}/call` : '/call';

    const result = await fetch(url, {
      method: 'POST',
      body: JSON.stringify(values),
    }).then((r) => r.text());

    if (result) setResult(result);
    setScreen('run');
    setLoading(false);
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

  if (statusCode === 401) {
    return <Unauthorized />;
  }

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
          deleteCookie('__zipper_temp_user_id');
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
          deleteCookie('__zipper_temp_user_id');
        }
        router.reload();
      },
    },
  };

  const showInput = (['initial', 'edit'] as Screen[]).includes(screen);
  const showRunOutput = (['edit', 'run'] as Screen[]).includes(screen);

  const canRunApp = useMemo(() => {
    return userAuthConnectors.every((connector) => {
      return (
        connector.appConnectorUserAuths && connector.appConnectorUserAuths[0]
      );
    });
  }, [userAuthConnectors]);

  return (
    <>
      <Head>
        <title>{appTitle}</title>
      </Head>
      <VStack flex={1} alignItems="stretch" spacing={14}>
        <Header {...app} fileName={filename} editUrl={editUrl} />
        <VStack as="main" flex={1} spacing={14}>
          {showInput && (
            <VStack maxW="container.sm" minW={500} align="stretch" spacing={6}>
              {userAuthConnectors.length > 0 && (
                <AuthUserConnectors
                  appTitle={appTitle}
                  actions={connectorActions}
                  userAuthConnectors={userAuthConnectors}
                />
              )}
              <UserInputs
                inputs={inputs}
                formContext={formContext}
                canRunApp={canRunApp}
                runApp={runApp}
                hasResult={Boolean(result)}
              />
            </VStack>
          )}
          {showRunOutput && (
            <VStack w="full" align="stretch" px={10} spacing={6}>
              {/* TODO run output should go here */}
            </VStack>
          )}
        </VStack>
      </VStack>

      {/* TODO translate this code into the new UI */}
      <Box as="main">
        <Flex as="header" mx={8} my={4} alignItems="center" color="gray.600">
          <Heading as="h2" color="black">
            {appTitle}
          </Heading>
          <Text
            fontWeight="100"
            ml={1}
            fontSize="3xl"
            height="full"
            color="gray.400"
          >
            @{version}
          </Text>
          <Text fontSize="sm" ml="auto">
            Powered by
          </Text>
          <ZipperLogo
            fill="currentColor"
            style={{ marginLeft: '8px', height: '13px' }}
          />
          <Box pl="2">
            <UserButton afterSignOutUrl="/" />
          </Box>
        </Flex>
        {app.description && (
          <Text mx={8} my={4} color="gray.600">
            {app.description}
          </Text>
        )}
        {userAuthConnectors.length > 0 && (
          <Box bg="gray.100" px={9} py={4}>
            <FunctionUserConnectors
              userAuthConnectors={userAuthConnectors}
              // TODO figure out the best strategy for removing connector user auth
              actions={{
                github: {
                  authUrl: githubAuthUrl || '#',
                  onDelete: async () => {
                    if (user) {
                      await removeAppConnectorUserAuth({
                        appId: app.id,
                        type: 'github',
                      });
                    } else {
                      deleteCookie('__zipper_temp_user_id');
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
                      deleteCookie('__zipper_temp_user_id');
                    }
                    router.reload();
                  },
                },
              }}
            />
          </Box>
        )}
        <Box bg="gray.100" px={8} py={4} mt={4}>
          {inputs.length > 0 && (
            <>
              <FunctionInputs params={inputs} formContext={formContext} />
              <Divider orientation="horizontal" my={4} />
            </>
          )}
          <Flex>
            <ButtonGroup>
              <Button colorScheme="purple" onClick={runApp}>
                Run
              </Button>
              <Button
                onClick={() => {
                  setResult('');
                  formContext.reset();
                }}
              >
                Reset
              </Button>
            </ButtonGroup>
          </Flex>
        </Box>
      </Box>
      {loading && (
        <Progress
          colorScheme="purple"
          size="xs"
          isIndeterminate
          width="full"
          position="absolute"
          background="transparent"
        />
      )}
      {result && (
        <Box py={4} px={8}>
          <FunctionOutput
            result={result}
            setOverallResult={setResult}
            setModalResult={setModalResult}
            setExpandedResult={setExpandedResult}
            getRunUrl={getRunUrl}
          />
        </Box>
      )}

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
              onClick={() => setIsExpandedResultOpen(!isExpandedResultOpen)}
            />
          </HStack>
          {isExpandedResultOpen && (
            <Box>{secondaryResultComponent(expandedResult)}</Box>
          )}
        </Box>
      )}
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
    tempUserId: req.cookies['__zipper_temp_user_id'],
    filename,
    token: await auth.getToken({ template: 'incl_orgs' }),
  });

  if (__DEBUG__) console.log('getAppInfo', { result });
  if (!result.ok) {
    if (result.error === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const { app, inputs, userAuthConnectors, editUrl } = result.data;

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
      editUrl,
      filename: filename || 'main.ts',
    },
  };

  const connectorsMissingAuth = userAuthConnectors
    .filter((c) => c.appConnectorUserAuths.length === 0)
    .map((c) => c.type);

  let slackAuthUrl: string | null = null;
  let githubAuthUrl: string | null = null;

  if (connectorsMissingAuth.includes('slack')) {
    const slackConnector = userAuthConnectors.find((c) => c.type === 'slack');
    if (slackConnector) {
      const state = encryptToHex(
        `${app.id}::${
          process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
        }${req.headers.host}::${
          auth.userId || req.cookies['__zipper_temp_user_id']
        }`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://slack.com/oauth/v2/authorize');
      url.searchParams.set(
        'client_id',
        slackConnector.clientId || process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      );
      url.searchParams.set('scope', slackConnector.workspaceScopes.join(','));
      url.searchParams.set('user_scope', slackConnector.userScopes.join(','));
      url.searchParams.set('state', state);

      slackAuthUrl = url.href;
    }
  }

  if (connectorsMissingAuth.includes('github')) {
    const githubConnector = userAuthConnectors.find((c) => c.type === 'github');
    if (githubConnector) {
      const state = encryptToHex(
        `${app.id}::${
          process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
        }${req.headers.host}::${
          auth.userId || req.cookies['__zipper_temp_user_id']
        }`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://github.com/login/oauth/authorize');
      url.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!);
      url.searchParams.set('scope', githubConnector.userScopes.join(','));
      url.searchParams.set('state', state);

      githubAuthUrl = url.href;
    }
  }

  return {
    props: { ...propsToReturn.props, slackAuthUrl, githubAuthUrl },
  };
};

export default withDefaultTheme(AppPage);
