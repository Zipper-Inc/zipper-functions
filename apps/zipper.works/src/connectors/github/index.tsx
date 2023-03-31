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
  Icon,
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
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { VscGithub } from 'react-icons/vsc';
import { code, scopes } from './constants';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { HiOutlineTrash, HiQuestionMarkCircle } from 'react-icons/hi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { GitHubCheckTokenResponse } from '@zipper/types';

export const githubConnector = createConnector({
  id: 'github',
  name: 'GitHub',
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

  const utils = trpc.useContext();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  // get the Github auth URL from the backend (it includes an encrypted state value that links
  // the auth request to the app)
  const githubAuthURL = trpc.useQuery([
    'githubConnector.getAuthUrl',
    {
      appId,
      scopes: scopesValue as string[],
      postInstallationRedirect: window.location.href,
    },
  ]);

  //  get the existing Github connector data from the database
  const connector = trpc.useQuery(['githubConnector.get', { appId }], {
    onSuccess: (data) => {
      if (data && setScopesValue) {
        setScopesValue(data?.userScopes || []);
      }
    },
  });

  const [isSaving, setIsSaving] = useState(false);

  const tokenName = 'GITHUB_TOKEN';

  // get the existing Github token from the database
  const existingSecret = trpc.useQuery([
    'secret.get',
    { appId, key: tokenName },
  ]);

  const toast = useToast();

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
      context.invalidateQueries(['githubConnector.get', { appId }]);
      toast({
        title: 'GitHub config updated.',
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    },
  });

  const existingInstallation = existingSecret.data && connector.data?.metadata;

  useEffect(() => {
    connectorForm.setValue(
      'isUserAuthRequired',
      connector.data?.isUserAuthRequired || false,
    );
  }, [connector.data?.isUserAuthRequired]);

  const saveConnector = async (data: any) => {
    if (githubAuthURL.data) {
      setIsSaving(true);
      await updateAppConnectorMutation.mutateAsync({
        appId,
        type: 'github',
        data: {
          isUserAuthRequired: data.isUserAuthRequired,
          userScopes: scopesValue as string[],
        },
      });

      router.push(githubAuthURL.data.url);
      setIsSaving(false);
    }
  };

  const deleteConnectorMutation = trpc.useMutation('githubConnector.delete', {
    async onSuccess() {
      await utils.invalidateQueries(['githubConnector.get', { appId }]);
      await utils.invalidateQueries(['secret.get', { appId, key: tokenName }]);
      await utils.invalidateQueries(['secret.all', { appId }]);
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
            before they're able to run this Zipper app and see the output.
          </FormHelperText>
        </FormControl>
      </HStack>
    );
  };

  return (
    <Box px="10" w="full">
      {githubConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{githubConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {existingInstallation ? (
              <>
                <Card w="full">
                  <CardBody color="gray.600">
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
                              color={'gray.900'}
                            >
                              {
                                (
                                  connector.data
                                    ?.metadata as GitHubCheckTokenResponse
                                ).app?.name
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
                                  <Text>User ID:</Text>
                                  <Code>
                                    {
                                      (
                                        connector.data
                                          ?.metadata as GitHubCheckTokenResponse
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
                                          ?.metadata as GitHubCheckTokenResponse
                                      ).user.login
                                    }
                                  </Code>
                                </HStack>
                                <HStack>
                                  <Text>Scopes:</Text>
                                  <HStack spacing="px">
                                    {(
                                      connector.data
                                        ?.metadata as GitHubCheckTokenResponse
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
                <CardBody color="gray.600">
                  <FormProvider {...connectorForm}>
                    <form onSubmit={connectorForm.handleSubmit(saveConnector)}>
                      <VStack align="start" w="full">
                        <FormControl pt="2">
                          <FormLabel color={'gray.500'}>Scopes</FormLabel>
                          <MultiSelect
                            options={scopesOptions}
                            value={scopesValue}
                            onChange={scopesOnChange as SelectOnChange}
                          />
                          {userAuthSwitch()}
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
          </VStack>
          <Divider my={4} />
          Connector code:
        </>
      )}
    </Box>
  );
}

export default GitHubConnectorForm;
