import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  VStack,
  Divider,
  Box,
  Text,
  Code,
  Progress,
  HStack,
  Button,
  Tooltip,
  useToast,
  IconButton,
  Heading,
} from '@chakra-ui/react';
import {
  FunctionInputs,
  FunctionOutput,
  TabButton,
  FunctionUserConnectors,
} from '@zipper/ui';
import { useEffect, useMemo, useState } from 'react';
import { LogLine } from '~/components/app/log-line';
import { useRunAppContext } from '../context/run-app-context';
import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';

import { HiOutlineClipboard, HiOutlinePlay } from 'react-icons/hi2';

type AppEditSidebarProps = {
  showInputForm: boolean;
  tips?: JSX.Element;
  appSlug: string;
};

export const AppEditSidebar: React.FC<AppEditSidebarProps> = ({
  showInputForm = true,
  tips,
  appSlug,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const {
    lastRunVersion,
    appEventsQuery,
    inputParams,
    formMethods,
    isRunning,
    result,
    run,
    userAuthConnectors,
    appInfo,
  } = useRunAppContext();

  const router = useRouter();
  const context = trpc.useContext();
  const deleteConnectorUserAuth = trpc.useMutation(
    'connector.slack.deleteUserAuth',
    {
      onSuccess: () => {
        context.invalidateQueries([
          'app.byResourceOwnerAndAppSlugs',
          {
            appSlug: router.query['app-slug'] as string,
            resourceOwnerSlug: router.query['resource-owner'] as string,
          },
        ]);
      },
    },
  );

  // state to hold whether user needs to authenticate with slack
  const [slackAuthRequired, setSlackAuthRequired] = useState(false);

  // get the existing Slack connector data from the database
  const slackConnector = trpc.useQuery(
    ['connector.slack.get', { appId: appInfo.id }],
    {
      enabled: slackAuthRequired,
    },
  );

  // get the Slack auth URL -- if required --from the backend
  // (it includes an encrypted state value that links the auth request to the app)
  const slackAuthURL = trpc.useQuery(
    [
      'connector.slack.getAuthUrl',
      {
        appId: appInfo.id,
        scopes: {
          bot: slackConnector.data?.workspaceScopes || [],
          user: slackConnector.data?.userScopes || [],
        },
        postInstallationRedirect: window.location.href,
      },
    ],
    {
      enabled: slackConnector.isFetched,
    },
  );

  useEffect(() => {
    if (userAuthConnectors.find((c) => c.type === 'slack')) {
      setSlackAuthRequired(true);
    }
  }, []);

  const logs = appEventsQuery?.data?.map((event: any) => event.eventPayload);

  useEffect(() => {
    // don't switch over on the intial load
    if (lastRunVersion) setTabIndex(0);
  }, [lastRunVersion]);

  const appLink = `${appSlug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`;
  const copyLink = async () => {
    await navigator.clipboard.writeText(appLink);
    toast({
      title: 'App link copied',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
  };
  const output = useMemo(() => <FunctionOutput result={result} />, [result]);

  return (
    <Tabs
      colorScheme="purple"
      index={tabIndex}
      onChange={handleTabsChange}
      flex={1}
      display="flex"
      flexDirection="column"
      gap={5}
      alignItems="stretch"
    >
      <TabList
        border="none"
        color="gray.500"
        gap={4}
        justifyContent="space-between"
        overflow="auto"
        p={1}
      >
        <HStack spacing={2}>
          {showInputForm && <TabButton title="Preview" />}
          {tips && <TabButton title="Tips" />}
          <TabButton title="Logs" isDisabled={!logs?.length} />
        </HStack>
        <HStack>
          <Button
            colorScheme="purple"
            variant="solid"
            onClick={run}
            display="flex"
            gap={2}
            fontWeight="medium"
            isDisabled={isRunning}
          >
            <HiOutlinePlay />
            <Text>Run</Text>
          </Button>
        </HStack>
      </TabList>
      <HStack
        bgColor="gray.100"
        color="purple.700"
        p={4}
        rounded="lg"
        justifyContent="space-between"
        overflow="auto"
      >
        <Text fontWeight="semibold" fontSize="xs" whiteSpace="nowrap" flex={1}>
          {appLink}
        </Text>
        <Tooltip label="Copy" bgColor="purple.500" textColor="gray.100">
          <IconButton
            aria-label="copy"
            colorScheme="purple"
            variant="ghost"
            size="xs"
            onClick={copyLink}
          >
            <HiOutlineClipboard />
          </IconButton>
        </Tooltip>
      </HStack>
      <TabPanels as={VStack} alignItems="stretch" flex={1}>
        {/* INPUT */}
        {showInputForm && (
          <TabPanel
            p={0}
            flex={1}
            display="flex"
            flexDir="column"
            alignItems="stretch"
          >
            {/** @todo make this height thing less jank */}
            {userAuthConnectors.length > 0 && (
              <Box p={4} mb="4" backgroundColor="gray.100" position="relative">
                <FunctionUserConnectors
                  userAuthConnectors={userAuthConnectors}
                  slack={{
                    authUrl: slackAuthURL.data?.url || '#',
                    onDelete: () => {
                      deleteConnectorUserAuth.mutateAsync({
                        appId: appInfo.id,
                      });
                    },
                  }}
                />
              </Box>
            )}
            <Box p={4} backgroundColor="gray.100" position="relative">
              <>
                <Heading size="sm" mb="4">
                  Inputs
                </Heading>
                {inputParams && inputParams.length ? (
                  <FunctionInputs
                    params={inputParams || []}
                    defaultValues={{}}
                    formContext={formMethods}
                  />
                ) : (
                  <>
                    <Text>
                      Add parameters to your main function and they'll show up
                      here. Here's an example:
                    </Text>
                    <Code my="5">
                      {`async function main({greeting}: {greeting: string}) {
                      ...
                    }`}
                    </Code>
                  </>
                )}{' '}
              </>
              {isRunning && (
                <Progress
                  colorScheme="purple"
                  size="xs"
                  isIndeterminate
                  width="full"
                  position="absolute"
                  left={0}
                  right={0}
                  bottom={0}
                />
              )}
            </Box>

            {result && <Box mt={4}>{output}</Box>}
          </TabPanel>
        )}

        {/* TIPS */}
        {tips && <TabPanel flex={1}>{tips}</TabPanel>}

        {/* LOGS */}
        <TabPanel flex={1}>
          <VStack
            spacing={0}
            align="start"
            fontFamily="monospace"
            fontSize={12}
            borderTop="1px"
            borderColor="gray.200"
            mt={-2}
            ml={-4}
            mr={-4}
            divider={<Divider />}
          >
            {logs?.map((log: any, i: number) => (
              <LogLine log={log} key={i} />
            ))}
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
