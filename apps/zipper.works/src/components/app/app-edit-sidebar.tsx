import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Divider,
  Box,
  Text,
  Code,
  Progress,
  Heading,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import {
  FunctionInputs,
  FunctionOutput,
  FunctionUserConnectors,
} from '@zipper/ui';
import { LogLine } from '~/components/app/log-line';
import { useRunAppContext } from '../context/run-app-context';
import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';

export function AppEditSidebar({
  showInputForm = true,
  tips,
  maxHeight,
}: {
  showInputForm: boolean;
  tips?: JSX.Element;
  maxHeight: string;
}) {
  const [tabIndex, setTabIndex] = useState(0);

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
        redirectTo: window.location.href,
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

  return (
    <Tabs
      colorScheme="purple"
      as={VStack}
      index={tabIndex}
      onChange={handleTabsChange}
      height="full"
    >
      <TabList>
        {showInputForm && <Tab>Preview</Tab>}
        {tips && <Tab>Tips</Tab>}
        <Tab isDisabled={!logs?.length}>Logs</Tab>
      </TabList>
      <TabPanels height="full">
        {/* INPUT */}
        {showInputForm && (
          <TabPanel p={0}>
            <Box
              maxHeight={`calc(${maxHeight} - 50px)`}
              overflowX="visible"
              overflowY="scroll"
            >
              {/** @todo make this height thing less jank */}
              {userAuthConnectors.length > 0 && (
                <Box
                  p={4}
                  mb="4"
                  backgroundColor="gray.100"
                  position="relative"
                >
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
                  )}
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

              {result && (
                <Box mt={4}>
                  <FunctionOutput result={result} />
                </Box>
              )}
            </Box>
          </TabPanel>
        )}

        {/* TIPS */}
        {tips && <TabPanel>{tips}</TabPanel>}

        {/* LOGS */}
        <TabPanel>
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
}
