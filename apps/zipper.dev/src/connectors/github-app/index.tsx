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
  FormHelperText,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  Icon,
  ModalContent,
  ModalOverlay,
  IconButton,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { VscGithubInverted } from 'react-icons/vsc';
import { code, scopes, events } from './constants';
import {
  Markdown,
  MultiSelect,
  SelectOnChange,
  useMultiSelect,
} from '@zipper/ui';
import { HiOutlineTrash } from 'react-icons/hi';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { useRunAppContext } from '~/components/context/run-app-context';
import {
  BootPayload,
  GithubAppConnectorInstallationMetadata,
} from '@zipper/types';
import { getZipperDotDevUrl } from '@zipper/utils';
import { HiOutlineCog, HiOutlineInformationCircle } from 'react-icons/hi2';
import { useEditorContext } from '~/components/context/editor-context';
import { updateConnectorConfig } from '~/utils/connector-codemod';
import { editor } from 'monaco-editor';
import { useMutation } from '@tanstack/react-query';
import { AppConnector, Script } from '@prisma/client';

export const githubAppConnector = createConnector({
  id: 'github-app',
  name: 'GitHub App',
  description: 'Build a GitHub bot & receive webhooks.',
  helperText: `This connector helps you create a GitHub App, using a manifest file, that can be installed on any repository. GitHub Apps can access GitHub's web API and receive webhooks.

After filling in the connector form, you'll be redirected to GitHub where the app will be created on either your personal account or the organization you specify. After the GitHub App is created, you'll be redirected back to Zipper where you can install the app on any repository. The settings of the app can be managed on GitHub.

The pre-filled code below will help you call GitHub's API on behalf of a specific installation as well as receive incoming webhooks.`,

  icon: <VscGithubInverted />,
  code,
  userScopes: scopes,
  events,
});

const __scope_options = scopes.map((scope) => ({
  label: scope,
  value: scope,
}));

const __event_options = events.map((scope) => ({
  label: scope,
  value: scope,
}));
export default function GitHubAppConnectorForm({ appId }: { appId: string }) {
  const { appInfo } = useRunAppContext();

  const {
    isOpen: isOpenInfo,
    onOpen: onOpenInfo,
    onClose: onCloseInfo,
  } = useDisclosure();

  const connector = trpc.githubAppConnector.get.useQuery({ appId });

  const [isSaving, setIsSaving] = useState(false);

  // @TODO
  const existingInstallation = false; // connector.data?.metadata;
  return (
    <>
      <Box px="6" w="full">
        {githubAppConnector && (
          <>
            <HStack mb="5" alignItems="center" justifyContent="start" gap="0">
              <Heading size="md">{githubAppConnector.name} Connector</Heading>
              <IconButton
                onClick={onOpenInfo}
                aria-label="info"
                variant="link"
                p="0"
              >
                <Icon as={HiOutlineInformationCircle} />
              </IconButton>
            </HStack>
            <VStack align="start">
              {appInfo.canUserEdit ? (
                <>
                  {existingInstallation ? (
                    <ExistingInstallation
                      {...{
                        isSaving,
                        setIsSaving,
                        appId,
                      }}
                    />
                  ) : (
                    <ThereAreNoInstallation
                      {...{
                        appId,
                        setIsSaving,
                        isSaving,
                      }}
                    />
                  )}
                </>
              ) : (
                <UserCantEdit connectorData={connector.data} />
              )}
            </VStack>
            <Divider my={4} />
            Connector code:
          </>
        )}
      </Box>

      <Modal isOpen={isOpenInfo} onClose={onCloseInfo}>
        <ModalOverlay />
        <ModalContent maxW="2xl">
          <ModalHeader>
            <HStack>
              <Text>GitHub Apps Connector</Text>
            </HStack>
          </ModalHeader>
          <ModalBody px="6" pb="6">
            <Markdown>{githubAppConnector.helperText || ''}</Markdown>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

const useConnectorV2UpdateMutation = (params: {
  getModelByFilename: (filename: string) => editor.ITextModel | null;
  scopesValue: string | string[] | undefined;
  organizationValue: string;
  eventsValue: string | string[] | undefined;
  appId: string;
  boot: (
    params?: { shouldSave?: boolean | undefined } | undefined,
  ) => Promise<BootPayload<false>>;
}) => {
  const context = trpc.useContext();
  const router = useRouter();
  const toast = useToast();

  return useMutation({
    mutationFn: async () => {
      const githubAppConnectorModel =
        params.getModelByFilename('github-app-connector.ts') ||
        params.getModelByFilename('github-app-connector.tsx');

      const code = githubAppConnectorModel?.getValue();
      if (!code) return;
      const newCode = updateConnectorConfig(code, 'githubAppConnectorConfig', {
        scopes: params.scopesValue,
        organization: params.organizationValue,
        events: params.eventsValue,
      });
      githubAppConnectorModel?.setValue(newCode);
      await params.boot({ shouldSave: true });
    },
    onSuccess: () => {
      context.app.byResourceOwnerAndAppSlugs.invalidate({
        appSlug: router.query['app-slug'] as string,
        resourceOwnerSlug: router.query['resource-owner'] as string,
      });

      context.githubAppConnector.get.invalidate({ appId: params.appId });
      toast({
        title: 'GitHub Appconfig updated.',
        status: 'success',
        duration: 1500,
        isClosable: true,
      });
    },
  });
};

type ThereAreNoInstallation = {
  isSaving: boolean;
  appId: string;
  setIsSaving: any;
};
function ThereAreNoInstallation(props: ThereAreNoInstallation) {
  const appId = props.appId;
  const [webhookName, setWebhookName] = useState<string>(
    'github-app-connector',
  );
  const { appInfo } = useRunAppContext();
  const { scripts, getModelByFilename } = useEditorContext();
  const { boot } = useRunAppContext();

  const connectorForm = useForm({
    defaultValues: {
      isUserAuthRequired: false,
      organization: '',
    },
  });
  const organizationValue = connectorForm.getValues('organization');
  const manifestFormRef = useRef<HTMLFormElement>(null);
  const manifestForm = useForm({
    defaultValues: {
      manifest: '',
    },
  });

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

  trpc.githubAppConnector.get.useQuery(
    { appId },
    {
      onSuccess: (data) => {
        if (data && setScopesValue && setEventsValue) {
          setScopesValue(data?.scopes || []);
          setEventsValue(data?.events || []);
        }
      },
    },
  );

  const stateValueQuery = trpc.githubAppConnector.getStateValue.useQuery({
    appId,
    postInstallationRedirect: window.location.href,
  });

  const selectedWebhookScript = useMemo(
    () => scripts.find((s) => s.name === webhookName) as Script,
    [webhookName],
  );

  const connectorV2UpdateMutation = useConnectorV2UpdateMutation({
    getModelByFilename,
    scopesValue: scopesValue,
    organizationValue: organizationValue,
    eventsValue: eventsValue,
    boot,
    appId,
  });

  const saveConnector = async () => {
    if (stateValueQuery.data) {
      props.setIsSaving(true);
      await connectorV2UpdateMutation.mutateAsync();
      const manifest = JSON.stringify({
        url: `https://${appInfo.slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`,
        redirect_url: `${getZipperDotDevUrl()}/connectors/github-app/manifest-redirect`,
        callback_urls: [`${getZipperDotDevUrl()}/connectors/github-app/auth`],
        hook_attributes: {
          url: `https://${appInfo.slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}/${selectedWebhookScript.filename}/raw`,
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

      props.setIsSaving(false);
    }
  };

  return (
    <Card w="full">
      <CardBody color="fg.600">
        <FormProvider {...manifestForm}>
          <form
            ref={manifestFormRef}
            action={
              organizationValue.length > 0
                ? `https://github.com/organizations/${connectorForm.getValues(
                    'organization',
                  )}/settings/apps/new?state=${stateValueQuery?.data}`
                : `https://github.com/settings/apps/new?state=${stateValueQuery?.data}`
            }
            method="post"
          >
            <input hidden={true} {...manifestForm.register('manifest')} />
          </form>
        </FormProvider>
        <FormProvider {...connectorForm}>
          <form onSubmit={connectorForm.handleSubmit(saveConnector)}>
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

              <FormControl>
                <FormLabel color={'fg.500'}>Organization</FormLabel>
                <Input {...connectorForm.register('organization')} />
                <FormHelperText pt="3" pb="4">
                  The organization that will own the GitHub App on GitHub. If
                  left blank, the app will be created on your personal account.
                </FormHelperText>
              </FormControl>
              <FormControl pb="6">
                <FormLabel color={'fg.500'}>Webhook Handler</FormLabel>
                <Select
                  defaultValue={'github-app-connector'}
                  onChange={(e) => {
                    setWebhookName(e.target.value);
                  }}
                >
                  {scripts
                    .filter((s) => s.isRunnable)
                    .map((s) => (
                      <option
                        value={s.name}
                        key={s.id}
                        selected={s.name === webhookName}
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
                isDisabled={props.isSaving}
              >
                Create GitHub App
              </Button>
            </VStack>
          </form>
        </FormProvider>
      </CardBody>
    </Card>
  );
}

type ExistingInstallation = {
  isSaving: boolean;
  setIsSaving: any;
  appId: string;
};
function ExistingInstallation(props: ExistingInstallation) {
  const appId = props.appId;

  const utils = trpc.useContext();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const { isOpen, onClose, onOpen } = useDisclosure();

  const connector = trpc.githubAppConnector.get.useQuery({
    appId,
  });
  const metadata = connector.data
    ?.metadata as GithubAppConnectorInstallationMetadata;

  const deleteConnectorMutation = trpc.githubAppConnector.delete.useMutation({
    async onSuccess() {
      await utils.githubAppConnector.get.invalidate({ appId });
      await utils.secret.all.invalidate({ appId });
    },
  });
  return (
    <>
      <Card w="full">
        <CardBody color="fg.600">
          <VStack align="stretch">
            <Heading size="sm">{metadata.name}</Heading>
            <Text>
              Boom! You've got a GitHub App that's ready to use with this
              applet. You can install it on any of your repositories and use the
              stored secrets to access GitHub's API.
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
                    metadata.owner.type === 'Organization'
                      ? `organizations/${metadata.owner.login}/settings/apps`
                      : 'settings/apps',
                  )}
                >
                  Manage Settings
                </Link>
              </HStack>
              <Button variant="unstyled" color="red.600" onClick={onOpen}>
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
                isDisabled={props.isSaving}
                onClick={async () => {
                  props.setIsSaving(true);
                  await deleteConnectorMutation.mutateAsync({
                    appId,
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

type UserCantEdit = {
  connectorData?: { scopes: Array<any>; events: any[] } | null;
};
function UserCantEdit({ connectorData }: UserCantEdit) {
  if (!connectorData) return null;
  return (
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
                {connectorData?.scopes.map((scope: string) => (
                  <Code key={scope}>{scope}</Code>
                ))}
              </Box>
            </HStack>

            <HStack>
              <Text>Events</Text>
              {connectorData?.events.map((event: string) => (
                <Code key={event}>{event}</Code>
              ))}
            </HStack>
          </VStack>
        </CardBody>
      </Card>
    </VStack>
  );
}
