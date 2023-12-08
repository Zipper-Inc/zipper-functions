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
import { updateConnectorConfig } from '~/utils/connector-codemod';

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
// convert the scopes to options for the multi-select menus
const __bot_options = workspaceScopes.map((scope) => ({
  label: scope,
  value: scope,
}));
const __user_options = userScopes.map((scope) => ({
  label: scope,
  value: scope,
}));
function SlackConnectorForm({ appId }: { appId: string }) {
  const { appInfo } = useRunAppContext();
  const { user } = useUser();
  const [clientId, setClientId] = useState<string>('');

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
          setBotValue(botValue || data.botScopes || [defaultBotScope]);
          setUserValue(userValue || data?.userScopes || []);

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

  const { getModelByFilename } = useEditorContext();
  const { boot } = useRunAppContext();

  const existingInstallation =
    (existingSecret.data || existingUserSecret.data) &&
    connector.data?.metadata;

  const router = useRouter();

  useEffect(() => {
    setIsUserAuthRequired(connector.data?.isUserAuthRequired);
    setClientId(connector.data?.clientId || '');
    setIsOwnClientIdRequired(!!connector.data?.clientId);
  }, [connector.isSuccess]);

  if (existingInstallation) {
    return (
      <SlackConnectorExistingInstalation
        connector={connector}
        isUserAuthRequired={isUserAuthRequired}
        setIsUserAuthRequired={setIsUserAuthRequired}
        userValue={userValue}
        isSaving={isSaving}
        setIsSaving={setIsSaving}
        deleteConnectorMutation={deleteConnectorMutation}
        appId={appId}
      />
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
              {/* {requiresOwnClientIdSwitch()} */}
              <RequireOwnClientIdSwitch
                isOwnClientIdRequired={isOwnClientIdRequired}
                setIsOwnClientIdRequired={setIsOwnClientIdRequired}
                clientId={clientId}
                setClientId={setClientId}
                clientSecret={clientSecret}
                setClientSecret={setClientSecret}
              />
              <Button
                mt="6"
                colorScheme={'purple'}
                isDisabled={false} // TODO: disabled
                onClick={async () => {
                  setIsSaving(true);
                  // TODO: think about isUserAuthRequired,
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

                    const newCode = updateConnectorConfig(
                      code,
                      'slackConnectorConfig',
                      {
                        clientId,
                        botScopes: botValue,
                        userScopes: userValue,
                      },
                    );
                    slackConnectorModel?.setValue(newCode);

                    let appInfo = getAppById.data;
                    if (!appInfo) {
                      const { data } = await getAppById.refetch();
                      if (!data) return;
                      appInfo = data;
                    }

                    await boot({ shouldSave: true });

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
type SlackCOnnectorExistingInstalationP = {
  connector: any;
  isUserAuthRequired: any;
  setIsUserAuthRequired: any;
  userValue: any;
  isSaving: boolean;
  setIsSaving: any;
  deleteConnectorMutation: any;
  appId: any;
};
function SlackConnectorExistingInstalation(
  props: SlackCOnnectorExistingInstalationP,
) {
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const { isOpen, onClose } = useDisclosure();

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
                    {(props.connector.data?.metadata as any)['team']['name']}
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
                      {props.connector.data?.clientId && (
                        <HStack>
                          <Text>Client ID:</Text>
                          <Code>{props.connector.data?.clientId}</Code>
                        </HStack>
                      )}
                      <HStack>
                        <Text>Bot User ID:</Text>
                        <Code>
                          {
                            (props.connector.data?.metadata as any)[
                              'bot_user_id'
                            ]
                          }
                        </Code>
                      </HStack>
                      <HStack>
                        <Text>Bot Scopes:</Text>
                        <Box>
                          {(
                            (props.connector.data?.metadata as any)['scope'] ||
                            ''
                          )
                            .split(',')
                            .map((scope: string) => (
                              <Code key={scope}>{scope}</Code>
                            ))}
                        </Box>
                      </HStack>

                      {(props.connector.data?.metadata as any)['authed_user'] &&
                        (props.connector.data?.metadata as any)['authed_user'][
                          'scope'
                        ] && (
                          <HStack>
                            <Text>User Scopes:</Text>
                            <Box>
                              {(props.connector.data?.metadata as any)[
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
              isUserAuthRequired={props.isUserAuthRequired}
              setIsUserAuthRequired={props.setIsUserAuthRequired}
              userValue={props.userValue}
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
                isDisabled={props.isSaving}
                onClick={async () => {
                  props.setIsSaving(true);
                  await props.deleteConnectorMutation.mutateAsync({
                    appId: props.appId,
                  });
                  props.setIsSaving(false);
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

type RequireOwnClientIdSwitchP = {
  isOwnClientIdRequired: any;
  setIsOwnClientIdRequired: any;
  clientId: any;
  setClientId: any;
  clientSecret: string;
  setClientSecret: any;
};
function RequireOwnClientIdSwitch(props: RequireOwnClientIdSwitchP) {
  return (
    <HStack w="full" pt="4" pb="4">
      <FormControl>
        <HStack w="full">
          <FormLabel>Custom client ID?</FormLabel>
          <Spacer flexGrow={1} />
          <Switch
            isChecked={props.isOwnClientIdRequired}
            ml="auto"
            onChange={(e) => {
              props.setIsOwnClientIdRequired(e.target.checked);
            }}
          />
        </HStack>
        <FormHelperText maxW="xl" mb="2">
          When checked, you can specify your own Slack client ID and secret.
          Useful if you need to enable features like the Events API or Slash
          Commands.
        </FormHelperText>

        <Collapse in={props.isOwnClientIdRequired} animateOpacity>
          <FormControl>
            <FormLabel color={'fg.500'}>Client ID</FormLabel>
            <Input
              value={props.clientId}
              onChange={(e) => props.setClientId(e.target.value)}
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
              value={props.clientSecret}
              onChange={(e) => props.setClientSecret(e.target.value)}
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
}

export default SlackConnectorForm;
