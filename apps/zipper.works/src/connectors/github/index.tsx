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
  Flex,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Spacer,
  Switch,
  Text,
  VStack,
  Image,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { FiTrash } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { VscGithub } from 'react-icons/vsc';
import { code, scopes } from './constants';
import Link from 'next/link';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { HiQuestionMarkCircle } from 'react-icons/hi';
import { useState } from 'react';
import { useRouter } from 'next/router';

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
  const connectorForm = useForm();
  // const isUserAuthRequired = connectorForm.watch('isUserAuthRequired');
  const isUserAuthRequired = false;

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

  const saveConnector = async (data: any) => {
    setIsSaving(true);
    await updateAppConnectorMutation.mutateAsync({
      appId,
      type: 'github',
      data: {
        isUserAuthRequired,
        userScopes: scopesValue as string[],
      },
    });
    setIsSaving(false);
  };

  return (
    <Box px="10" w="full">
      {githubConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{githubConnector.name}</Heading>
            <Text>Configure the {githubConnector.name} connector.</Text>
          </Box>
          <VStack align="start">
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
                          // onSubmit={connectorForm.handleSubmit(saveConnector)}
                          onSubmit={(e) => {
                            e.preventDefault();
                            console.log('submitting github config');
                          }}
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
                                  isChecked={isUserAuthRequired}
                                  ml="auto"
                                  onChange={(e) => {
                                    // setIsUserAuthRequired(e.target.checked);
                                  }}
                                />
                              </HStack>

                              <Button
                                type="submit"
                                colorScheme={'purple'}
                                // isDisabled={isSaving}
                                onClick={async () => {
                                  // setIsSaving(true);
                                  // await updateAppConnectorMutation.mutateAsync({
                                  //   appId,
                                  //   type: 'slack',
                                  //   data: {
                                  //     isUserAuthRequired,
                                  //     userScopes: userValue as string[],
                                  //     workspaceScopes: botValue as string[],
                                  //   },
                                  // });
                                  // setIsSaving(false);
                                }}
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
                            {/* <Text>Add to Github</Text> */}
                            Add to Github
                            {/* <Image
                                alt="Add to Slack"
                                src="https://platform.slack-edge.com/img/add_to_slack.png"
                                srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                              /> */}
                          </Link>
                        ) : (
                          <Text>Add to Github</Text>
                          // <Image
                          //   alt="Add to Slack"
                          //   src="https://platform.slack-edge.com/img/add_to_slack.png"
                          //   srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
                          // />
                        )}
                      </VStack>
                    </AccordionPanel>
                  </AccordionItem>
                </Accordion>
              </CardBody>
            </Card>
            {/* {connector.schema.clientId ?? ()}
            {connector.schema.clientSecret ?? ()}
            {connector.schema.scopes ?? ()} */}
          </VStack>
          <Divider my={4} />
          Connector code:
        </>
      )}
    </Box>
  );
}

export default GitHubConnectorForm;
