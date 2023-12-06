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
import { useUser } from '~/hooks/use-user';
import { useEditorContext } from '~/components/context/editor-context';
import { initLocalApplet } from '~/utils/local-applet';

// configure the Slack connector
export const slackConnector = createConnector({
  id: 'slack',
  name: 'Slack',
  description: `Use Slack's APIs to build interactive apps.`,
  icon: <FiSlack fill="black" />,
  code,
  userScopes,
  workspaceScopes,
});

const defaultBotScope = 'channels:read';
const botTokenName = 'SLACK_BOT_TOKEN';
const userTokenName = 'SLACK_USER_TOKEN';
function SlackConnectorForm({ appId }: { appId: string }) {
  const { appInfo } = useRunAppContext();
  const { user } = useUser();
  const [clientId, setClientId] = useState<string>('');

  // convert the scopes to options for the multi-select menus
  const __bot_options = workspaceScopes.map((scope) => ({
    label: scope,
    value: scope,
  }));
  const __user_options = userScopes.map((scope) => ({
    label: scope,
    value: scope,
  }));

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
  const connector = trpc.slackConnector.get.useQuery(
    { appId },
    {
      onSuccess: (data) => {
        if (data && setBotValue && setUserValue) {
          setBotValue(data.botScopes || [defaultBotScope]);
          setUserValue(data?.userScopes || []);

          // do we want to set this?
          if (data?.clientId) {
            setIsOwnClientIdRequired(true);
            setClientId(data?.clientId || '');
          }
        }
      },
    },
  );

  const [isOwnClientIdRequired, setIsOwnClientIdRequired] =
    useState<boolean>(false);

  return (
    <Box px="6" w="full">
      {slackConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{slackConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {appInfo.canUserEdit ? (
              <SlackConnectorFormConUserEdit
                appId={appId}
                botOnChange={botOnChange}
                botOptions={botOptions}
                botValue={botValue}
                clientId={clientId}
                connector={connector}
                isOwnClientIdRequired={isOwnClientIdRequired}
                setClientId={setClientId}
                setIsOwnClientIdRequired={setIsOwnClientIdRequired}
                user={user}
                userOnChange={userOnChange}
                userOptions={userOptions}
                userValue={userValue}
              />
            ) : (
              <VStack align="stretch" w="full">
                <Card w="full">
                  <CardBody>
                    <Heading size="sm">Configuration</Heading>
                    <VStack
                      align="start"
                      divider={<StackDivider />}
                      fontSize="sm"
                      py="2"
                      mt="2"
                    >
                      <HStack>
                        <Text>Bot Scopes:</Text>
                        <Box>
                          {connector.data?.botScopes.map((scope: string) => (
                            <Code key={scope}>{scope}</Code>
                          ))}
                        </Box>
                      </HStack>

                      <HStack>
                        <Text>User Scopes:</Text>
                        <Box>
                          {connector.data?.userScopes.map((scope: string) => (
                            <Code key={scope}>{scope}</Code>
                          ))}
                        </Box>
                      </HStack>

                      {/* <HStack>
                        <Text>User auth required?</Text>
                        <Code>
                          {connector.data?.isUserAuthRequired ? 'Yes' : 'No'}
                        </Code>
                      </HStack> */}
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </VStack>
          <Text mt="10" color="fg.600">
            Connector code:
          </Text>
        </>
      )}
    </Box>
  );
}

type UserAuthSwitch = {
  isUserAuthRequired: any;
  setIsUserAuthRequired: any;
  userValue: any;
};
function UserAuthSwitch({
  isUserAuthRequired,
  setIsUserAuthRequired,
  userValue,
}: UserAuthSwitch) {
  return (
    <HStack w="full" pt="4" pb="4">
      <FormControl>
        <HStack w="full">
          <FormLabel>Require users to auth?</FormLabel>
          <Spacer flexGrow={1} />
          <Switch
            isChecked={isUserAuthRequired}
            isDisabled={!userValue || userValue.length === 0}
            ml="auto"
            onChange={(e) => {
              setIsUserAuthRequired(e.target.checked);
            }}
          />
        </HStack>
        <FormHelperText maxW="xl">
          When checked, users will have to authorize the Slack integration
          before they're able to run this Zipper app and see the output.
          Requires at least 1 user scope. The user's Slack token will be
          available via the HandlerContext at runtime.
        </FormHelperText>
      </FormControl>
    </HStack>
  );
}

function SlackConnectorFormConUserEdit({
  appId,
  botOnChange,
  botOptions,
  botValue,
  clientId,
  connector,
  isOwnClientIdRequired,
  setClientId,
  setIsOwnClientIdRequired,
  user,
  userOnChange,
  userOptions,
  userValue,
}: any) {
  const [isUserAuthRequired, setIsUserAuthRequired] = useState(
    connector.data?.isUserAuthRequired,
  );
  const utils = trpc.useContext();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const context = trpc.useContext();
  const [isSaving, setIsSaving] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');

  const existingSecret = trpc.secret.get.useQuery(
    { appId, key: botTokenName },
    { enabled: !!user },
  );

  const existingUserSecret = trpc.secret.get.useQuery(
    { appId, key: userTokenName },
    { enabled: !!user },
  );

  const addSecretMutation = trpc.secret.add.useMutation();
  const getAppById = trpc.app.byId.useQuery({ id: appId });

  const deleteConnectorMutation = trpc.slackConnector.delete.useMutation({
    async onSuccess() {
      await utils.slackConnector.get.invalidate({ appId });
      await utils.secret.get.invalidate({ appId, key: botTokenName });
    },
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const { getModelByFilename, save } = useEditorContext();

  const existingInstallation =
    (existingSecret.data || existingUserSecret.data) &&
    connector.data?.metadata;

  const requiresOwnClientIdSwitch = () => {
    return (
      <HStack w="full" pt="4" pb="4">
        <FormControl>
          <HStack w="full">
            <FormLabel>Custom client ID?</FormLabel>
            <Spacer flexGrow={1} />
            <Switch
              isChecked={isOwnClientIdRequired}
              ml="auto"
              onChange={(e) => {
                setIsOwnClientIdRequired(e.target.checked);
              }}
            />
          </HStack>
          <FormHelperText maxW="xl" mb="2">
            When checked, you can specify your own Slack client ID and secret.
            Useful if you need to enable features like the Events API or Slash
            Commands.
          </FormHelperText>

          <Collapse in={isOwnClientIdRequired} animateOpacity>
            <FormControl>
              <FormLabel color={'fg.500'}>Client ID</FormLabel>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </FormControl>

            <FormControl pt="2">
              <FormLabel color={'fg.500'}>
                Client Secret
                <Text
                  as="span"
                  fontFamily="mono"
                  color="fg.400"
                  fontSize="sm"
                  ml="2"
                >
                  SLACK_CLIENT_SECRET
                </Text>
              </FormLabel>

              <Input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </FormControl>

            <FormControl pt="2">
              <FormLabel>Redirect URL</FormLabel>
              <Text>
                Set your Slack app's redirect URL to:{' '}
                {process.env.NODE_ENV === 'development' ? (
                  <Code>https://your.ngrok.url/connectors/slack/auth</Code>
                ) : (
                  <Code>https://zipper.dev/connectors/slack/auth</Code>
                )}
              </Text>
            </FormControl>
          </Collapse>
        </FormControl>
      </HStack>
    );
  };

  const router = useRouter();

  useEffect(() => {
    setIsUserAuthRequired(connector.data?.isUserAuthRequired);
    setClientId(connector.data?.clientId || '');
    setIsOwnClientIdRequired(!!connector.data?.clientId);
  }, [connector.isSuccess]);

  if (existingInstallation) {
    return (
      <>
        <Card w="full">
          <CardBody color="fg.600">
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
                      color={'fg.900'}
                    >
                      {(connector.data?.metadata as any)['team']['name']}
                    </FormLabel>
                  </PopoverTrigger>
                  <PopoverContent w="sm">
                    <PopoverArrow />
                    <PopoverHeader>Installation details</PopoverHeader>
                    <PopoverBody>
                      <VStack
                        align="start"
                        divider={<StackDivider />}
                        fontSize="sm"
                        py="2"
                      >
                        {connector.data?.clientId && (
                          <HStack>
                            <Text>Client ID:</Text>
                            <Code>{connector.data?.clientId}</Code>
                          </HStack>
                        )}
                        <HStack>
                          <Text>Bot User ID:</Text>
                          <Code>
                            {(connector.data?.metadata as any)['bot_user_id']}
                          </Code>
                        </HStack>
                        <HStack>
                          <Text>Bot Scopes:</Text>
                          <Box>
                            {((connector.data?.metadata as any)['scope'] || '')
                              .split(',')
                              .map((scope: string) => (
                                <Code key={scope}>{scope}</Code>
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
                {/* TODO: Uninstall */}
                {/* {slackAuthURL.data && (
                  <Button variant="unstyled" color="red.600" onClick={onOpen}>
                    <HStack>
                      <HiOutlineTrash />
                      <Text>Uninstall</Text>
                    </HStack>
                  </Button>
                )} */}
              </HStack>
              <UserAuthSwitch
                isUserAuthRequired={isUserAuthRequired}
                setIsUserAuthRequired={setIsUserAuthRequired}
                userValue={userValue}
              />
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
    );
  }

  return (
    <>
      <Card w="full">
        <CardBody color="fg.600">
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
              <UserAuthSwitch
                isUserAuthRequired={isUserAuthRequired}
                setIsUserAuthRequired={setIsUserAuthRequired}
                userValue={userValue}
              />
              {requiresOwnClientIdSwitch()}

              <Button
                mt="6"
                colorScheme={'purple'}
                isDisabled={false} // TODO: disabled
                onClick={async () => {
                  setIsSaving(true);
                  if (isOwnClientIdRequired && clientId && clientSecret) {
                    await addSecretMutation.mutateAsync({
                      appId: appId,
                      key: 'SLACK_CLIENT_SECRET',
                      value: clientSecret,
                    });

                    // This should update the Monaco model, instead of the code column in the database
                    // Update monaco model will update Yjs doc (solving sync issue). The code column will be updated on save
                    const slackConnectorModel =
                      getModelByFilename('slack-connector.ts');

                    const code = slackConnectorModel?.getValue();
                    if (!code) return;

                    // TODO: think about isUserAuthRequired,
                    slackConnectorModel?.setValue(
                      code.replace(
                        'UPDATE_MY_CONFIG_HERE',
                        JSON.stringify(
                          {
                            clientId,
                            botScopes: botValue as string[],
                            userScopes: userValue as string[],
                          },
                          null,
                          2,
                        ),
                      ),
                    );

                    let appInfo = getAppById.data;
                    if (!appInfo) {
                      const { data } = await getAppById.refetch();
                      if (!data) return;
                      appInfo = data;
                    }

                    // FIXME: save isnt working
                    // await save();

                    // slack-connector.ts a handler returns a link to install the app
                    initLocalApplet(appInfo.slug)
                      .path('slack-connector')
                      .run({ action: 'get-auth-url' })
                      .then((link) => {
                        if (link) {
                          router.push(link);
                        }
                      })
                      .catch(() => undefined);
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
    </>
  );
}

export default SlackConnectorForm;
