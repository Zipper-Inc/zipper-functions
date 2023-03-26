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
  Link,
  Code,
  IconButton,
  Spacer,
  StackDivider,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { VscGithub } from 'react-icons/vsc';
import { code, scopes } from './constants';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { HiOutlineTrash, HiQuestionMarkCircle } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { GithubCheckTokenResponse } from '@zipper/types';

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
        title: 'Github config updated.',
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
    setIsSaving(true);
    await updateAppConnectorMutation.mutateAsync({
      appId,
      type: 'github',
      data: {
        isUserAuthRequired: data.isUserAuthRequired,
        userScopes: scopesValue as string[],
      },
    });
    setIsSaving(false);
  };

  const deleteConnectorMutation = trpc.useMutation('githubConnector.delete', {
    async onSuccess() {
      await utils.invalidateQueries(['githubConnector.get', { appId }]);
      await utils.invalidateQueries(['secret.get', { appId, key: tokenName }]);
      await utils.invalidateQueries(['secret.all', { appId }]);
    },
  });

  return (
    <Box px="10" w="full">
      {githubConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{githubConnector.name}</Heading>
            <Text>Configure the {githubConnector.name} connector.</Text>
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
                      {githubAuthURL.data && (
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
                        <Text>Managed by OAuth App:</Text>
                        <Code>
                          {
                            (
                              connector.data
                                ?.metadata as GithubCheckTokenResponse
                            ).app.name
                          }
                        </Code>
                      </HStack>
                      <HStack>
                        <Text>User ID:</Text>
                        <Code>
                          {
                            (
                              connector.data
                                ?.metadata as GithubCheckTokenResponse
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
                                ?.metadata as GithubCheckTokenResponse
                            ).user.login
                          }
                        </Code>
                      </HStack>
                      <HStack>
                        <Text>Scopes:</Text>
                        <HStack spacing="px">
                          {(
                            connector.data?.metadata as GithubCheckTokenResponse
                          ).scopes?.map((scope: string) => (
                            <Code>{scope}</Code>
                          ))}
                        </HStack>
                      </HStack>
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
                        {...connectorForm.register('isUserAuthRequired')}
                        ml="auto"
                        onChange={(e) => {
                          updateAppConnectorMutation.mutateAsync({
                            appId,
                            type: 'github',
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
                      <AccordionButton>
                        <Box
                          as="h2"
                          flex={1}
                          textAlign="left"
                          fontSize="md"
                          fontWeight="semibold"
                          color="gray.600"
                        >
                          Configure scopes
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <FormProvider {...connectorForm}>
                          <form
                            onSubmit={connectorForm.handleSubmit(saveConnector)}
                          >
                            <VStack align="start" w="full">
                              <FormControl pt="2">
                                <FormLabel color={'gray.500'}>
                                  Scopes
                                  <Icon ml="2" as={HiQuestionMarkCircle} />
                                </FormLabel>
                                <MultiSelect
                                  options={scopesOptions}
                                  value={scopesValue}
                                  onChange={scopesOnChange as SelectOnChange}
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
                                    ml="auto"
                                    isChecked={isUserAuthRequired}
                                    {...connectorForm.register(
                                      'isUserAuthRequired',
                                    )}
                                  />
                                </HStack>
                                <Button
                                  type="submit"
                                  colorScheme={'purple'}
                                  isDisabled={isSaving}
                                >
                                  Save
                                </Button>
                              </FormControl>
                            </VStack>
                          </form>
                        </FormProvider>
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
                          {githubAuthURL.data ? (
                            <Link href={githubAuthURL.data?.url}>
                              Add to Github
                            </Link>
                          ) : (
                            <Text>Add to Github</Text>
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

export default GitHubConnectorForm;
