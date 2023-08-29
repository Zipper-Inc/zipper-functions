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
  Text,
  VStack,
  useToast,
  Spacer,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Link,
  Select,
  Code,
  StackDivider,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { VscGithubInverted } from 'react-icons/vsc';
import { code, scopes, events } from './constants';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { HiOutlineTrash } from 'react-icons/hi';
import { useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRunAppContext } from '~/components/context/run-app-context';
import { GithubAppConnectorInstallationMetadata } from '@zipper/types';
import { getZipperDotDevUrl } from '@zipper/utils';
import { HiOutlineCog } from 'react-icons/hi2';
import { useEditorContext } from '~/components/context/editor-context';

export const githubAppConnector = createConnector({
  id: 'github-app',
  name: 'GitHub App',
  description: 'Build a GitHub bot & receive webhooks',
  icon: <VscGithubInverted />,
  code,
  userScopes: scopes,
  events,
});

function GitHubAppConnectorForm({ appId }: { appId: string }) {
  const { scripts } = useEditorContext();
  const __scope_options = scopes.map((scope) => ({
    label: scope,
    value: scope,
  }));

  const __event_options = events.map((scope) => ({
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

  const {
    value: eventsValue,
    options: eventsOptions,
    onChange: eventsOnChange,
    setValue: setEventsValue,
  } = useMultiSelect({
    options: __event_options,
    value: [],
  });

  const connectorForm = useForm({
    defaultValues: {
      isUserAuthRequired: false,
    },
  });

  const manifestForm = useForm({
    defaultValues: {
      manifest: '',
    },
  });

  const manifestFormRef = useRef<HTMLFormElement>(null);

  const { appInfo } = useRunAppContext();

  const utils = trpc.useContext();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  const stateValueQuery = trpc.useQuery([
    'githubAppConnector.getStateValue',
    {
      appId,
      postInstallationRedirect: window.location.href,
    },
  ]);

  const connector = trpc.useQuery(['githubAppConnector.get', { appId }], {
    onSuccess: (data) => {
      if (data && setScopesValue && setEventsValue) {
        setScopesValue(data?.userScopes || []);
        setEventsValue(data?.events || []);
      }
    },
  });

  const [isSaving, setIsSaving] = useState(false);
  const [webhookPath, setWebhookPath] = useState<string>(
    'github-app-connector.ts',
  );

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
      context.invalidateQueries(['githubAppConnector.get', { appId }]);
      toast({
        title: 'GitHub Appconfig updated.',
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    },
  });

  const existingInstallation = connector.data?.metadata;

  const saveConnector = async (data: any) => {
    if (stateValueQuery.data) {
      setIsSaving(true);

      await updateAppConnectorMutation.mutateAsync({
        appId,
        type: 'github-app',
        data: {
          userScopes: scopesValue as string[],
          events: eventsValue as string[],
        },
      });

      const manifest = JSON.stringify({
        url: `https://${appInfo.slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`,
        redirect_url: `${getZipperDotDevUrl()}/connectors/github-app/manifest-redirect`,
        callback_urls: [`${getZipperDotDevUrl()}/connectors/github-app/auth`],
        hook_attributes: {
          url: `https://${appInfo.slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}/${webhookPath}/raw`,
        },
        public: true,
        default_events: eventsValue,
        default_permissions: (scopesValue as string[]).reduce((p, c) => {
          const scopeParts = c.split(':');
          if (scopeParts[0] && scopeParts[1]) p[scopeParts[0]] = scopeParts[1];

          return p;
        }, {} as Record<string, string>),
      });

      manifestForm.setValue('manifest', manifest);
      manifestFormRef.current?.submit();

      setIsSaving(false);
    }
  };

  const deleteConnectorMutation = trpc.useMutation(
    'githubAppConnector.delete',
    {
      async onSuccess() {
        await utils.invalidateQueries(['githubAppConnector.get', { appId }]);
        await utils.invalidateQueries(['secret.all', { appId }]);
      },
    },
  );

  const metadata = connector.data
    ?.metadata as GithubAppConnectorInstallationMetadata;

  return (
    <Box px="6" w="full">
      {githubAppConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{githubAppConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {appInfo.canUserEdit ? (
              <>
                {existingInstallation ? (
                  <>
                    <Card w="full">
                      <CardBody color="fg.600">
                        <VStack align="stretch">
                          <Heading size="sm">{metadata.name}</Heading>
                          <Text>
                            Boom! You've got a GitHub App that's ready to use
                            with this applet. You can install it on any of your
                            repositories and use the stored secrets to access
                            GitHub's API.
                          </Text>
                          <HStack w="full" pt="2" spacing="4">
                            <Button
                              as={Link}
                              target="_blank"
                              colorScheme="primary"
                              href={`${metadata.html_url}/installations/select_target`}
                              _hover={{ textDecoration: 'none' }}
                            >
                              Install
                            </Button>
                            <Spacer />
                            <HStack>
                              <HiOutlineCog />
                              <Link
                                _hover={{ textDecoration: 'none' }}
                                target="_blank"
                                href={metadata.html_url.replace(
                                  'apps',
                                  'settings/apps',
                                )}
                              >
                                Manage Settings
                              </Link>
                            </HStack>
                            <Button
                              variant="unstyled"
                              color="red.600"
                              onClick={onOpen}
                            >
                              <HStack>
                                <HiOutlineTrash />
                                <Text>Remove</Text>
                              </HStack>
                            </Button>
                          </HStack>
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
                            Remove GitHub App
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
                      <FormProvider {...manifestForm}>
                        <form
                          ref={manifestFormRef}
                          action={`https://github.com/settings/apps/new?state=${stateValueQuery?.data}`}
                          method="post"
                        >
                          <input
                            hidden={true}
                            {...manifestForm.register('manifest')}
                          />
                        </form>
                      </FormProvider>
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
                            </FormControl>
                            <FormControl>
                              <FormLabel color={'fg.500'}>Events</FormLabel>
                              <MultiSelect
                                options={eventsOptions}
                                value={eventsValue}
                                onChange={eventsOnChange as SelectOnChange}
                              />
                            </FormControl>
                            <FormControl pb="6">
                              <FormLabel color={'fg.500'}>
                                Webhook Handler
                              </FormLabel>
                              <Select
                                defaultValue={'github-app-connector.ts'}
                                onChange={(e) => {
                                  setWebhookPath(e.target.value);
                                }}
                              >
                                {scripts
                                  .filter((s) => s.isRunnable)
                                  .map((s) => (
                                    <option
                                      value={s.filename}
                                      key={s.id}
                                      selected={s.filename === webhookPath}
                                    >
                                      {s.filename}
                                    </option>
                                  ))}
                              </Select>
                            </FormControl>
                            <Button
                              mt="6"
                              type="submit"
                              colorScheme={'purple'}
                              isDisabled={isSaving}
                            >
                              Create GitHub App
                            </Button>
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
                        <Text>Scopes:</Text>
                        <Box>
                          {connector.data?.userScopes.map((scope: string) => (
                            <Code key={scope}>{scope}</Code>
                          ))}
                        </Box>
                      </HStack>

                      <HStack>
                        <Text>Events</Text>
                        {connector.data?.events.map((event: string) => (
                          <Code key={event}>{event}</Code>
                        ))}
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

export default GitHubAppConnectorForm;
