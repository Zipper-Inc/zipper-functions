import createConnector from '../createConnector';
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Card,
  CardBody,
  Code,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  Spacer,
  StackDivider,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiSlack } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { HiOutlineTrash, HiQuestionMarkCircle } from 'react-icons/hi';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { useRouter } from 'next/router';
import { code, userScopes, workspaceScopes } from './constants';

// configure the Slack connector
export const slackConnector = createConnector({
  id: 'slack',
  name: 'Slack',
  icon: <FiSlack fill="black" />,
  code,
  userScopes,
  workspaceScopes,
});

function SlackConnectorForm({ appId }: { appId: string }) {
  const utils = trpc.useContext();

  // convert the scopes to options for the multi-select menus
  const __bot_options = workspaceScopes.map((scope) => ({
    label: scope,
    value: scope,
  }));
  const __user_options = userScopes.map((scope) => ({
    label: scope,
    value: scope,
  }));

  const defaultBotScope = 'channels:read';
  const botTokenName = 'SLACK_BOT_TOKEN';

  // useMultiSelect hook gives us the value state and the onChange and setValue methods
  // for the multi-select menus
  const {
    value: botValue,
    options: botOptions,
    onChange: botOnChange,
    setValue: setBotValue,
  } = useMultiSelect({
    options: __bot_options,
    value: [defaultBotScope],
  });

  const {
    value: userValue,
    options: userOptions,
    onChange: userOnChange,
    setValue: setUserValue,
  } = useMultiSelect({
    options: __user_options,
    value: [],
  });

  // get the existing Slack connector data from the database
  const connector = trpc.useQuery(['connector.slack.get', { appId }], {
    onSuccess: (data) => {
      if (data && setBotValue && setUserValue) {
        setBotValue(data.workspaceScopes || [defaultBotScope]);
        setUserValue(data?.userScopes || []);
      }
    },
  });

  const [isUserAuthRequired, setIsUserAuthRequired] = useState(
    connector.data?.isUserAuthRequired,
  );

  const [isSaving, setIsSaving] = useState(false);

  // get the existing Slack bot token from the database
  const existingSecret = trpc.useQuery([
    'secret.get',
    { appId, key: botTokenName },
  ]);

  // get the Slack auth URL from the backend (it includes an encrypted state value that links
  // the auth request to the app)
  const slackAuthURL = trpc.useQuery([
    'connector.slack.getAuthUrl',
    {
      appId,
      scopes: { bot: botValue as string[], user: userValue as string[] },
      postInstallationRedirect: window.location.href,
    },
  ]);

  const context = trpc.useContext();
  const router = useRouter();
  const updateAppConnectorMutation = trpc.useMutation('appConnector.update', {
    onSuccess: () => {
      context.invalidateQueries([
        'app.byResourceOwnerAndAppSlugs',
        {
          appSlug: router.query['app-slug'] as string,
          resourceOwnerSlug: router.query['resource-owner'] as string,
        },
      ]);
    },
  });

  const deleteConnectorMutation = trpc.useMutation('connector.slack.delete', {
    async onSuccess() {
      await utils.invalidateQueries(['connector.slack.get', { appId }]);
      await utils.invalidateQueries([
        'secret.get',
        { appId, key: botTokenName },
      ]);
    },
  });

  useEffect(() => {
    setIsUserAuthRequired(connector.data?.isUserAuthRequired);
  }, [connector.data?.isUserAuthRequired]);

  const existingInstallation = existingSecret.data && connector.data?.metadata;

  if (existingSecret.isLoading || connector.isLoading) {
    return <></>;
  }

  return (
    <Box px="10" w="full">
      {slackConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{slackConnector.name}</Heading>
            <Text>Configure the {slackConnector.name} connector.</Text>
          </Box>
          <VStack align="start">
            {existingInstallation ? (
              <>
                <Card w="full">
                  <CardBody color="gray.600">
                    <HStack>
                      <Heading size="sm" mb="4">
                        Current installation
                      </Heading>
                      <Spacer />
                      {slackAuthURL.data && (
                        <IconButton
                          aria-label="Delete connector"
                          variant="ghost"
                          onClick={() => {
                            deleteConnectorMutation.mutateAsync({
                              appId,
                            });
                          }}
                          icon={<Icon as={HiOutlineTrash} color="gray.400" />}
                        />
                      )}
                    </HStack>
                    <VStack
                      align="start"
                      divider={<StackDivider />}
                      fontSize="sm"
                    >
                      <HStack>
                        <Text>Installed to:</Text>
                        <Code>
                          {(connector.data?.metadata as any)['team']['name']}
                        </Code>
                      </HStack>
                      <HStack>
                        <Text>Bot User ID:</Text>
                        <Code>
                          {(connector.data?.metadata as any)['bot_user_id']}
                        </Code>
                      </HStack>
                      <HStack>
                        <Text>Bot Scopes:</Text>
                        <Box>
                          {(connector.data?.metadata as any)['scope']
                            .split(',')
                            .map((scope: string) => (
                              <Code>{scope}</Code>
                            ))}
                        </Box>
                      </HStack>

                      {(connector.data?.metadata as any)['authed_user'] &&
                        (connector.data?.metadata as any)['authed_user'][
                          'scope'
                        ] && (
                          <HStack>
                            <Text>User Scopes:</Text>
                            <Box>
                              {(connector.data?.metadata as any)['authed_user'][
                                'scope'
                              ]
                                .split(',')
                                .map((scope: string) => (
                                  <Code>{scope}</Code>
                                ))}
                            </Box>
                          </HStack>
                        )}
                    </VStack>
                  </CardBody>
                </Card>
                <Card w="full">
                  <CardBody color="gray.600" fontSize="sm">
                    <Heading size="sm" mb="4">
                      Configuration
                    </Heading>
                    <HStack w="full" pt="2">
                      <Box mr="auto">
                        <HStack>
                          <Text>Require users to auth to access your app</Text>
                        </HStack>
                      </Box>
                      <Switch
                        isChecked={isUserAuthRequired}
                        ml="auto"
                        onChange={(e) => {
                          setIsUserAuthRequired(e.target.checked);
                          updateAppConnectorMutation.mutateAsync({
                            appId,
                            type: 'slack',
                            data: { isUserAuthRequired: e.target.checked },
                          });
                        }}
                      />
                    </HStack>
                  </CardBody>
                </Card>
              </>
            ) : (
              <Card w="full">
                <CardBody color="gray.600">
                  <Accordion allowMultiple={true}>
                    <AccordionItem border={'none'}>
                      <h2>
                        <AccordionButton>
                          <Box
                            as="span"
                            flex="1"
                            textAlign="left"
                            fontSize={'md'}
                            fontWeight="semibold"
                            color={'gray.600'}
                          >
                            Configure scopes
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <VStack align="start" w="full">
                          <FormControl>
                            <FormLabel color={'gray.500'}>
                              Bot Scopes
                              <Icon ml="2" as={HiQuestionMarkCircle} />
                            </FormLabel>
                            <MultiSelect
                              options={botOptions}
                              value={botValue}
                              onChange={botOnChange as SelectOnChange}
                            />
                          </FormControl>

                          <FormControl pt="2">
                            <FormLabel color={'gray.500'}>
                              User Scopes
                              <Icon ml="2" as={HiQuestionMarkCircle} />
                            </FormLabel>

                            <MultiSelect
                              options={userOptions}
                              value={userValue}
                              onChange={userOnChange as SelectOnChange}
                            />
                            <HStack w="full" pt="2" pb="4">
                              <Box mr="auto">
                                <HStack>
                                  <Text>
                                    Require users to auth to access your app
                                  </Text>
                                </HStack>
                              </Box>
                              <Switch
                                isChecked={isUserAuthRequired}
                                ml="auto"
                                onChange={(e) => {
                                  setIsUserAuthRequired(e.target.checked);
                                }}
                              />
                            </HStack>

                            <Button
                              colorScheme={'purple'}
                              isDisabled={isSaving}
                              onClick={async () => {
                                setIsSaving(true);
                                await updateAppConnectorMutation.mutateAsync({
                                  appId,
                                  type: 'slack',
                                  data: {
                                    isUserAuthRequired,
                                    userScopes: userValue as string[],
                                    workspaceScopes: botValue as string[],
                                  },
                                });

                                setIsSaving(false);
                              }}
                            >
                              Save
                            </Button>
                          </FormControl>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>

                    <AccordionItem border={'none'}>
                      <h2>
                        <AccordionButton>
                          <Box
                            as="span"
                            flex="1"
                            textAlign="left"
                            fontWeight="semibold"
                            color={'gray.600'}
                          >
                            Install the app
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <VStack align="start" w="full">
                          {slackAuthURL.data ? (
                            <Link href={slackAuthURL.data?.url}>
                              <Image
                                alt="Add to Slack"
                                src="https://platform.slack-edge.com/img/add_to_slack.png"
                                srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                              />
                            </Link>
                          ) : (
                            <Image
                              alt="Add to Slack"
                              src="https://platform.slack-edge.com/img/add_to_slack.png"
                              srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                            />
                          )}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </CardBody>
              </Card>
            )}
          </VStack>
          <Divider my={4} />
          Connector code:
        </>
      )}
    </Box>
  );
}

export default SlackConnectorForm;
