import createConnector from '../createConnector';
import {
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Switch,
  Text,
  VStack,
  useToast,
  Spacer,
  StackDivider,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  useDisclosure,
  FormHelperText,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Code,
  Collapse,
  Input,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { VscGithub } from 'react-icons/vsc';
import { code, scopes } from './constants';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { HiOutlineTrash } from 'react-icons/hi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRunAppContext } from '~/components/context/run-app-context';
import { GithubConnectorAuthMetadata } from '@zipper/types';

export const githubConnector = createConnector({
  id: 'github',
  name: 'GitHub OAuth',
  description: `Access GitHub's API as a user.`,
  icon: <VscGithub />,
  code,
  userScopes: scopes,
});

function GitHubConnectorForm({ appId }: { appId: string }) {
  const __scope_options = scopes.map((scope) => ({
    label: scope,
    value: scope,
  }));
  const {
    value: scopesValue,
    options: scopesOptions,
    onChange: scopesOnChange,
    setValue: setScopesValue,
  } = useMultiSelect({
    options: __scope_options,
    value: [],
  });
  const connectorForm = useForm({
    defaultValues: {
      isUserAuthRequired: false,
    },
  });
  const isUserAuthRequired = connectorForm.watch('isUserAuthRequired');

  const { appInfo } = useRunAppContext();

  const utils = trpc.useContext();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  // get the Github auth URL from the backend (it includes an encrypted state value that links
  // the auth request to the app)
  const githubAuthURL = trpc.githubConnector.getAuthUrl.useQuery({
    appId,
    scopes: scopesValue as string[],
    postInstallationRedirect: window.location.href,
  });

  //  get the existing Github connector data from the database
  const connector = trpc.githubConnector.get.useQuery(
    { appId },
    {
      onSuccess: (data) => {
        if (data && setScopesValue) {
          setScopesValue(data?.userScopes || []);
        }
      },
    },
  );

  const [clientId, setClientId] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string>('');

  const [isOwnClientIdRequired, setIsOwnClientIdRequired] =
    useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);

  const tokenName = 'GITHUB_TOKEN';

  // get the existing Github token from the database
  const existingSecret = trpc.secret.get.useQuery(
    { appId, key: tokenName },
    { enabled: !!appInfo?.canUserEdit },
  );

  const existingClientSecretSecret = trpc.secret.get.useQuery(
    { appId, key: 'GITHUB_CLIENT_SECRET' },
    { enabled: isOwnClientIdRequired },
  );

  const toast = useToast();

  const context = trpc.useContext();
  const router = useRouter();
  const updateAppConnectorMutation = trpc.appConnector.update.useMutation({
    onSuccess: () => {
      context.app.byResourceOwnerAndAppSlugs.invalidate({
        appSlug: router.query['app-slug'] as string,
        resourceOwnerSlug: router.query['resource-owner'] as string,
      });
      context.githubConnector.get.invalidate({ appId });
      toast({
        title: 'GitHub config updated.',
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    },
  });

  const existingInstallation = existingSecret.data && connector.data?.metadata;

  const addSecretMutation = trpc.secret.add.useMutation();

  useEffect(() => {
    connectorForm.setValue(
      'isUserAuthRequired',
      connector.data?.isUserAuthRequired || false,
    );
    setClientId(connector.data?.clientId || '');
    setIsOwnClientIdRequired(!!connector.data?.clientId);
  }, [connector.isSuccess]);

  const saveConnector = async (data: any) => {
    if (githubAuthURL.data) {
      setIsSaving(true);

      if (isOwnClientIdRequired && clientId && clientSecret) {
        await addSecretMutation.mutateAsync({
          appId: appId,
          key: 'GITHUB_CLIENT_SECRET',
          value: clientSecret,
        });
      }
      await updateAppConnectorMutation.mutateAsync({
        appId,
        type: 'github',
        data: {
          isUserAuthRequired: data.isUserAuthRequired,
          clientId: isOwnClientIdRequired ? clientId || undefined : null,
          userScopes: scopesValue as string[],
        },
      });

      const updatedUrl = await githubAuthURL.refetch();

      if (updatedUrl.data) {
        router.push(updatedUrl.data?.url);
      }
      setIsSaving(false);
    }
  };

  const deleteConnectorMutation = trpc.githubConnector.delete.useMutation({
    async onSuccess() {
      await utils.githubConnector.get.invalidate({ appId });
      await utils.secret.get.invalidate({ appId, key: tokenName });
      await utils.secret.all.invalidate({ appId });
    },
  });

  const userAuthSwitch = (mutateOnChange?: boolean) => {
    return (
      <HStack w="full" pt="4" pb="4">
        <FormControl>
          <HStack w="full">
            <FormLabel>Require users to auth?</FormLabel>
            <Spacer flexGrow={1} />
            <Switch
              isChecked={isUserAuthRequired}
              {...connectorForm.register('isUserAuthRequired')}
              ml="auto"
              onChange={(e) => {
                if (mutateOnChange) {
                  updateAppConnectorMutation.mutateAsync({
                    appId,
                    type: 'github',
                    data: { isUserAuthRequired: e.target.checked },
                  });
                }

                connectorForm.setValue(
                  'isUserAuthRequired',
                  !isUserAuthRequired,
                );
              }}
            />
          </HStack>
          <FormHelperText maxW="xl">
            When checked, users will have to authorize the GitHub integration
            before they're able to run this Zipper app and see the output. The
            user's GitHub token will be available the HandlerContext at runtime.
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
          <FormHelperText maxW="xl" mb="2">
            When checked, users will have the ability to add custom client ID
            and secret.
          </FormHelperText>

          <Collapse in={isOwnClientIdRequired} animateOpacity>
            <FormControl>
              <FormLabel color={'fg.500'}>Client ID</FormLabel>
              <Input
                autoComplete="new-password"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
              />
            </FormControl>

            <FormControl pt="2">
              <FormLabel color={'fg.500'}>
                Client Secret{' '}
                <Text
                  fontFamily="mono"
                  as="span"
                  color="fg.400"
                  ml="2"
                  fontSize="sm"
                >
                  GITHUB_CLIENT_SECRET
                </Text>
              </FormLabel>

              <Input
                autoComplete="new-password"
                required={isOwnClientIdRequired}
                type="password"
                onChange={(e) => setClientSecret(e.target.value)}
              />
            </FormControl>
            <FormControl pt="2">
              <FormLabel>Redirect URL</FormLabel>
              <Text>
                Set your GitHub OAuth app's application callback URL to:{' '}
                {process.env.NODE_ENV === 'development' ? (
                  <Code>https://your.ngrok.url/connectors/github/auth</Code>
                ) : (
                  <Code>https://zipper.dev/connectors/github/auth</Code>
                )}
              </Text>
            </FormControl>
          </Collapse>
        </FormControl>
      </HStack>
    );
  };

  return (
    <Box px="6" w="full">
      {githubConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{githubConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {appInfo.canUserEdit ? (
              <>
                {existingInstallation ? (
                  <>
                    <Card w="full">
                      <CardBody color="fg.600">
                        <VStack align="stretch">
                          <Heading size="sm">Configuration</Heading>
                          <HStack w="full" pt="2" spacing="1">
                            <FormLabel m="0">Managed by OAuth App</FormLabel>
                            <Popover trigger="hover">
                              <PopoverTrigger>
                                <FormLabel
                                  cursor="context-menu"
                                  textDecor="underline"
                                  textDecorationStyle="dotted"
                                  color={'fg.900'}
                                >
                                  {
                                    (
                                      connector.data
                                        ?.metadata as GithubConnectorAuthMetadata
                                    ).app?.name
                                  }
                                </FormLabel>
                              </PopoverTrigger>
                              <PopoverContent>
                                <PopoverArrow />
                                <PopoverHeader>
                                  Installation details
                                </PopoverHeader>
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
                                      <Text>User ID:</Text>
                                      <Code>
                                        {
                                          (
                                            connector.data
                                              ?.metadata as GithubConnectorAuthMetadata
                                          ).user.id
                                        }
                                      </Code>
                                    </HStack>
                                    <HStack>
                                      <Text>User:</Text>
                                      <Code>
                                        {
                                          (
                                            connector.data
                                              ?.metadata as GithubConnectorAuthMetadata
                                          ).user.login
                                        }
                                      </Code>
                                    </HStack>
                                    <HStack>
                                      <Text>Scopes:</Text>
                                      <HStack spacing="px">
                                        {(
                                          connector.data
                                            ?.metadata as GithubConnectorAuthMetadata
                                        ).scopes?.map((scope: string) => (
                                          <Code>{scope}</Code>
                                        ))}
                                      </HStack>
                                    </HStack>
                                  </VStack>
                                </PopoverBody>
                              </PopoverContent>
                            </Popover>
                            <Spacer />
                            {githubAuthURL.data && (
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
                          {userAuthSwitch(true)}
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
                            Uninstall GitHub App
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
                    <CardBody color="fg.600">
                      <FormProvider {...connectorForm}>
                        <form
                          onSubmit={connectorForm.handleSubmit(saveConnector)}
                        >
                          <VStack align="start" w="full">
                            <FormControl>
                              <FormLabel color={'fg.500'}>Scopes</FormLabel>
                              <MultiSelect
                                options={scopesOptions}
                                value={scopesValue}
                                onChange={scopesOnChange as SelectOnChange}
                              />
                              {userAuthSwitch()}
                              {requiresOwnClientIdSwitch()}
                              <Button
                                mt="6"
                                type="submit"
                                colorScheme={'purple'}
                                isDisabled={isSaving}
                              >
                                Save & Install
                              </Button>
                            </FormControl>
                          </VStack>
                        </form>
                      </FormProvider>
                    </CardBody>
                  </Card>
                )}
              </>
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
                        <Text>User Scopes:</Text>
                        <Box>
                          {connector.data?.userScopes.map((scope: string) => (
                            <Code key={scope}>{scope}</Code>
                          ))}
                        </Box>
                      </HStack>

                      <HStack>
                        <Text>User auth required?</Text>
                        <Code>
                          {connector.data?.isUserAuthRequired ? 'Yes' : 'No'}
                        </Code>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </VStack>
          <Divider my={4} />
          Connector code:
        </>
      )}
    </Box>
  );
}

export default GitHubConnectorForm;
