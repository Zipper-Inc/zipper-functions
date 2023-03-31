import createConnector from '../createConnector';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Card,
  CardBody,
  Code,
  Collapse,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Spacer,
  StackDivider,
  Switch,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { FiSlack } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { HiOutlineTrash } from 'react-icons/hi';
import { useEffect, useRef, useState } from 'react';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { useRouter } from 'next/router';
import { code, userScopes, workspaceScopes } from './constants';
import { useRunAppContext } from '~/components/context/run-app-context';

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  const { appInfo } = useRunAppContext();
  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');

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
  const connector = trpc.useQuery(['slackConnector.get', { appId }], {
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

  const [isOwnClientIdRequired, setIsOwnClientIdRequired] =
    useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);

  // get the existing Slack bot token from the database
  const existingSecret = trpc.useQuery([
    'secret.get',
    { appId, key: botTokenName },
  ]);

  // get the Slack auth URL from the backend (it includes an encrypted state value that links
  // the auth request to the app)
  const slackAuthURL = trpc.useQuery([
    'slackConnector.getAuthUrl',
    {
      appId,
      scopes: { bot: botValue as string[], user: userValue as string[] },
      postInstallationRedirect: window.location.href,
    },
  ]);

  const [slackAuthInProgress, setSlackAuthInProgress] = useState(false);

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

  const addSecretMutation = trpc.useMutation('secret.add');

  const deleteConnectorMutation = trpc.useMutation('slackConnector.delete', {
    async onSuccess() {
      await utils.invalidateQueries(['slackConnector.get', { appId }]);
      await utils.invalidateQueries([
        'secret.get',
        { appId, key: botTokenName },
      ]);
    },
  });

  useEffect(() => {
    setIsUserAuthRequired(connector.data?.isUserAuthRequired);
  }, [connector.data?.isUserAuthRequired]);

  useEffect(() => {
    if (slackAuthInProgress && slackAuthURL.data?.url) {
      router.push(slackAuthURL.data?.url);
      setSlackAuthInProgress(false);
    }
  }, [slackAuthInProgress, slackAuthURL.data?.url]);

  const existingInstallation = existingSecret.data && connector.data?.metadata;

  if (existingSecret.isLoading || connector.isLoading || !appInfo.canUserEdit) {
    return <></>;
  }

  const userAuthSwitch = () => {
    return (
      <HStack w="full" pt="4" pb="4">
        <FormControl>
          <HStack w="full">
            <FormLabel>Require users to auth?</FormLabel>
            <Spacer flexGrow={1} />
            <Switch
              isChecked={isUserAuthRequired}
              ml="auto"
              onChange={(e) => {
                setIsUserAuthRequired(e.target.checked);
              }}
            />
          </HStack>
          <FormHelperText maxW="xl">
            When checked, users will have to authorize the Slack app before
            they're able to run the app and see the output.
          </FormHelperText>
        </FormControl>
      </HStack>
    );
  };

  const requiresOwnClientIdSwitch = () => {
    return (
      <HStack w="full" pt="4" pb="4">
        <FormControl>
          <HStack w="full">
            <FormLabel>Require own client ID?</FormLabel>
            <Spacer flexGrow={1} />
            <Switch
              isChecked={isOwnClientIdRequired}
              ml="auto"
              onChange={(e) => {
                setIsOwnClientIdRequired(e.target.checked);
              }}
            />
          </HStack>
          <FormHelperText maxW="xl">
            When checked, users will have the ability to add custom client ID
            and secret.
          </FormHelperText>

          <Collapse in={isOwnClientIdRequired} animateOpacity>
            <FormControl>
              <FormLabel color={'gray.500'}>Client ID</FormLabel>
              <Input
                autoComplete="new-password"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </FormControl>

            <FormControl pt="2">
              <FormLabel color={'gray.500'}>Client Secret</FormLabel>

              <Input
                autoComplete="new-password"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </FormControl>
          </Collapse>
        </FormControl>
      </HStack>
    );
  };

  return (
    <Box px="10" w="full">
      {slackConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{slackConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {existingInstallation ? (
              <>
                <Card w="full">
                  <CardBody color="gray.600">
                    <VStack align="stretch">
                      <Heading size="sm">Configuration</Heading>
                      <HStack w="full" pt="2" spacing="1">
                        <FormLabel m="0">Installed to</FormLabel>
                        <Popover trigger="hover">
                          <PopoverTrigger>
                            <FormLabel
                              cursor="context-menu"
                              textDecor="underline"
                              textDecorationStyle="dotted"
                              color={'gray.900'}
                            >
                              {
                                (connector.data?.metadata as any)['team'][
                                  'name'
                                ]
                              }
                            </FormLabel>
                          </PopoverTrigger>
                          <PopoverContent>
                            <PopoverArrow />
                            <PopoverHeader>Installation details</PopoverHeader>
                            <PopoverBody>
                              <VStack
                                align="start"
                                divider={<StackDivider />}
                                fontSize="sm"
                                py="2"
                              >
                                <HStack>
                                  <Text>Bot User ID:</Text>
                                  <Code>
                                    {
                                      (connector.data?.metadata as any)[
                                        'bot_user_id'
                                      ]
                                    }
                                  </Code>
                                </HStack>
                                <HStack>
                                  <Text>Bot Scopes:</Text>
                                  <Box>
                                    {(connector.data?.metadata as any)['scope']
                                      .split(',')
                                      .map((scope: string) => (
                                        <Code key={scope}>{scope}</Code>
                                      ))}
                                  </Box>
                                </HStack>

                                {(connector.data?.metadata as any)[
                                  'authed_user'
                                ] &&
                                  (connector.data?.metadata as any)[
                                    'authed_user'
                                  ]['scope'] && (
                                    <HStack>
                                      <Text>User Scopes:</Text>
                                      <Box>
                                        {(connector.data?.metadata as any)[
                                          'authed_user'
                                        ]['scope']
                                          .split(',')
                                          .map((scope: string) => (
                                            <Code key={scope}>{scope}</Code>
                                          ))}
                                      </Box>
                                    </HStack>
                                  )}
                              </VStack>
                            </PopoverBody>
                          </PopoverContent>
                        </Popover>
                        <Spacer />
                        {slackAuthURL.data && (
                          <Button
                            variant="unstyled"
                            color="red.600"
                            onClick={onOpen}
                          >
                            <HStack>
                              <HiOutlineTrash />
                              <Text>Uninstall</Text>
                            </HStack>
                          </Button>
                        )}
                      </HStack>
                      {userAuthSwitch()}
                    </VStack>
                  </CardBody>
                </Card>
                <AlertDialog
                  isOpen={isOpen}
                  leastDestructiveRef={cancelRef}
                  onClose={onClose}
                >
                  <AlertDialogOverlay>
                    <AlertDialogContent>
                      <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Uninstall Slack App
                      </AlertDialogHeader>

                      <AlertDialogBody>
                        Are you sure? You can't undo this action afterwards.
                      </AlertDialogBody>

                      <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                          Cancel
                        </Button>
                        <Button
                          colorScheme="red"
                          isDisabled={isSaving}
                          onClick={async () => {
                            setIsSaving(true);
                            await deleteConnectorMutation.mutateAsync({
                              appId,
                            });
                            setIsSaving(false);
                            onClose();
                          }}
                          ml={3}
                        >
                          Uninstall
                        </Button>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialogOverlay>
                </AlertDialog>
              </>
            ) : (
              <Card w="full">
                <CardBody color="gray.600">
                  <VStack align="start" w="full" overflow="visible">
                    <Heading size="sm">Configuration</Heading>
                    <FormControl>
                      <FormControl>
                        <FormLabel>Bot Scopes</FormLabel>
                        <MultiSelect
                          options={botOptions}
                          value={botValue}
                          onChange={botOnChange as SelectOnChange}
                        />
                      </FormControl>

                      <FormControl pt="4">
                        <FormLabel>User Scopes</FormLabel>

                        <MultiSelect
                          options={userOptions}
                          value={userValue}
                          onChange={userOnChange as SelectOnChange}
                        />
                      </FormControl>
                      {userAuthSwitch()}
                      {requiresOwnClientIdSwitch()}

                      <Button
                        mt="6"
                        colorScheme={'purple'}
                        isDisabled={isSaving || !slackAuthURL.data}
                        onClick={async () => {
                          if (slackAuthURL.data) {
                            setIsSaving(true);
                            if (
                              isOwnClientIdRequired &&
                              clientId &&
                              clientSecret
                            ) {
                              await addSecretMutation.mutateAsync({
                                appId: appId,
                                key: 'SLACK_CLIENT_SECRET',
                                value: clientSecret,
                              });
                            }
                            await updateAppConnectorMutation.mutateAsync({
                              appId,
                              type: 'slack',
                              data: {
                                isUserAuthRequired,
                                userScopes: userValue as string[],
                                workspaceScopes: botValue as string[],
                                clientId: clientId || undefined,
                              },
                            });
                            await slackAuthURL.refetch();
                            setSlackAuthInProgress(true);
                          }
                          setIsSaving(false);
                        }}
                      >
                        Save & Install
                      </Button>
                    </FormControl>
                  </VStack>
                </CardBody>
              </Card>
            )}
          </VStack>
          <Text mt="10" color="gray.600">
            Connector code:
          </Text>
        </>
      )}
    </Box>
  );
}

export default SlackConnectorForm;
