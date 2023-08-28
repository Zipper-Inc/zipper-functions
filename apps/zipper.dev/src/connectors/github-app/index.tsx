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
import { VscGithubInverted } from 'react-icons/vsc';
import { code, scopes, events } from './constants';
import { MultiSelect, SelectOnChange, useMultiSelect } from '@zipper/ui';
import { HiOutlineTrash } from 'react-icons/hi';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRunAppContext } from '~/components/context/run-app-context';
import { GithubConnectorAuthMetadata } from '@zipper/types';

export const githubAppConnector = createConnector({
  id: 'githubApp',
  name: 'GitHub App',
  icon: <VscGithubInverted />,
  code,
  userScopes: scopes,
  events,
});

function GitHubAppConnectorForm({ appId }: { appId: string }) {
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

  const { appInfo } = useRunAppContext();

  const utils = trpc.useContext();

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  // get the Github auth URL from the backend (it includes an encrypted state value that links
  // the auth request to the app)
  const stateValueQuery = trpc.useQuery([
    'githubAppConnector.getStateValue',
    {
      appId,
      postInstallationRedirect: window.location.href,
    },
  ]);

  //  get the existing Github connector data from the database
  const connector = trpc.useQuery(['githubAppConnector.get', { appId }], {
    onSuccess: (data) => {
      if (data && setScopesValue && setEventsValue) {
        setScopesValue(data?.userScopes || []);
        setEventsValue(data?.events || []);
      }
    },
  });

  // const [clientId, setClientId] = useState<string>('');
  // const [clientSecret, setClientSecret] = useState<string>('');

  // const [isOwnClientIdRequired, setIsOwnClientIdRequired] =
  //   useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);

  // const tokenName = 'GITHUB_TOKEN';

  // // get the existing Github token from the database
  // const existingSecret = trpc.useQuery(
  //   ['secret.get', { appId, key: tokenName }],
  //   { enabled: !!appInfo?.canUserEdit },
  // );

  // const existingClientSecretSecret = trpc.useQuery(
  //   ['secret.get', { appId, key: 'GITHUB_CLIENT_SECRET' }],
  //   { enabled: isOwnClientIdRequired },
  // );

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
        type: 'githubApp',
        data: {
          userScopes: scopesValue as string[],
          events: eventsValue as string[],
        },
      });
      const formdata = new FormData();
      formdata.append(
        'manifest',
        JSON.stringify({
          url: `https://${appInfo.slug}.zipper.run/raw`,
          redirect_url: `https://zipper.dev/connectors/github-app/manifest-redirect`,
          callback_urls: ['https://zipper.dev/connectors/github-app/auth'],
          hook_attributes: {
            url: `https://${appInfo.slug}.zipper.run`,
          },
          public: true,
          default_events: eventsValue,
          default_permissions: (scopesValue as string[]).reduce((p, c) => {
            const scopeParts = c.split(':');
            if (scopeParts[0] && scopeParts[1])
              p[scopeParts[0]] = scopeParts[1];

            return p;
          }, {} as Record<string, string>),
        }),
      );
      const res = await fetch('https://github.com/settings/apps/new', {
        method: 'POST',
        body: formdata,
      });

      console.log(res.redirected, res.url);

      // create the app using a manifest
      setIsSaving(false);
    }
  };

  const deleteConnectorMutation = trpc.useMutation(
    'githubAppConnector.delete',
    {
      async onSuccess() {
        await utils.invalidateQueries(['githubAppConnector.get', { appId }]);
        // await utils.invalidateQueries([
        //   'secret.get',
        //   { appId, key: tokenName },
        // ]);
        await utils.invalidateQueries(['secret.all', { appId }]);
      },
    },
  );

  console.log(githubAppConnector);

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
                          <Heading size="sm">Configuration</Heading>
                          <HStack w="full" pt="2" spacing="1"></HStack>
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
                            </FormControl>
                            <FormControl>
                              <FormLabel color={'fg.500'}>Events</FormLabel>
                              <MultiSelect
                                options={eventsOptions}
                                value={eventsValue}
                                onChange={eventsOnChange as SelectOnChange}
                              />
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
              // user can't edit
              <></>
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
