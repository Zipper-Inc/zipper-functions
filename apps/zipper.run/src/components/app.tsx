import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import {
  FunctionInputs,
  withDefaultTheme,
  ZipperLogo,
  FunctionOutput,
  useCmdOrCtrl,
  FunctionUserConnectors,
} from '@zipper/ui';
import { AppInfo, InputParams, UserAuthConnector } from '@zipper/types';
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
} from '@chakra-ui/react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { getInputValuesFromUrl } from '../utils/get-input-values-from-url';
import { useRouter } from 'next/router';
import { encryptToHex } from '@zipper/utils';
import { deleteCookie } from 'cookies-next';

const { __DEBUG__ } = process.env;

export function AppPage({
  app,
  inputs,
  userAuthConnectors,
  version = app.lastDeploymentVersion || Date.now().toString(32),
  filename,
  defaultValues,
  slackAuthUrl,
}: {
  app: AppInfo;
  inputs: InputParams;
  userAuthConnectors: UserAuthConnector[];
  version?: string;
  filename?: string;
  defaultValues?: Record<string, any>;
  slackAuthUrl?: string;
}) {
  const router = useRouter();
  const appTitle = app.name || app.slug;
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState('');
  const [expandedResult, setExpandedResult] = useState('');
  const [modalResult, setModalResult] = useState({ heading: '', body: '' });
  const [loading, setLoading] = useState(false);

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

  return (
    <>
      <Head>
        <title>{appTitle}</title>
      </Head>
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
              slack={{
                authUrl: slackAuthUrl || '#',
                onDelete: () => {
                  deleteCookie('__zipper_user_id');
                  router.reload();
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
        <Box py={4} px={8}>
          {secondaryResultComponent(expandedResult)}
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

  // grab the app if it exists
  const result = await getAppInfo({
    subdomain,
    userId: req.cookies['__zipper_user_id'],
    filename,
  });

  if (__DEBUG__) console.log('getAppInfo', { result });
  if (!result.ok) return { notFound: true };

  const { app, inputs, userAuthConnectors } = result.data;

  const version =
    versionFromUrl ||
    app.lastDeploymentVersion?.toString() ||
    Date.now().toString();

  const defaultValues = getInputValuesFromUrl(inputs, req.url);
  if (__DEBUG__) console.log({ defaultValues });

  const propsToReturn = {
    props: {
      app,
      inputs,
      version,
      defaultValues,
      userAuthConnectors,
      filename: filename || 'main.ts',
    },
  };

  const connectorsMissingAuth = userAuthConnectors
    .filter((c) => c.isUserAuthRequired)
    .filter((c) => c.appConnectorUserAuths.length === 0)
    .map((c) => c.type);

  if (connectorsMissingAuth.includes('slack')) {
    const slackConnector = userAuthConnectors.find((c) => c.type === 'slack');
    if (slackConnector) {
      const state = encryptToHex(
        `${app.id}::${
          process.env.NODE_ENV === 'development' ? 'http://' : 'https://'
        }${req.headers.host}::${req.cookies['__zipper_user_id']}`,
        process.env.ENCRYPTION_KEY || '',
      );

      const url = new URL('https://slack.com/oauth/v2/authorize');
      url.searchParams.set(
        'client_id',
        process.env.NEXT_PUBLIC_SLACK_CLIENT_ID!,
      );
      url.searchParams.set('scope', slackConnector.workspaceScopes.join(','));
      url.searchParams.set('user_scope', slackConnector.userScopes.join(','));
      url.searchParams.set('state', state);

      return { props: { ...propsToReturn.props, slackAuthUrl: url.href } };
    }
  }

  return propsToReturn;
};

export default withDefaultTheme(AppPage);
