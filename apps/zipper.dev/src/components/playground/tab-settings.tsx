import {
  Button,
  Input,
  Heading,
  VStack,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Icon,
  InputGroup,
  InputRightElement,
  Textarea,
  useToast,
  HStack,
  Text,
  Switch,
  Divider,
  Box,
  IconButton,
  Spinner,
  Center,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  ModalOverlay,
  ModalContent,
  Tooltip,
  Flex,
  Spacer,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogCloseButton,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';

import { inferQueryOutput, trpc } from '~/utils/trpc';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from 'slugify';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { useRouter } from 'next/router';
import { getAppLink } from '@zipper/utils';
import {
  PiLockSimple,
  PiLockSimpleOpen,
  PiLockLaminated,
  PiLockLaminatedOpen,
  PiCode,
  PiCodeSimple,
  PiEnvelopeSimpleOpen,
  PiEnvelopeSimple,
  PiKeyBold,
  PiTrashSimpleBold,
  PiClipboardBold,
} from 'react-icons/pi';
import { TITLE_COLUMN_MIN_WIDTH } from './constants';

type Props = {
  app: Pick<
    Unpack<inferQueryOutput<'app.byId'>>,
    | 'id'
    | 'name'
    | 'slug'
    | 'description'
    | 'requiresAuthToRun'
    | 'isPrivate'
    | 'isDataSensitive'
  >;
};

const SettingsTab: React.FC<Props> = ({ app }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const {
    isOpen: isOpenDeleteConfirmation,
    onOpen: onOpenDeleteConfirmation,
    onClose: onCloseDeleteConfirmation,
  } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const appQuery = trpc.useQuery(['app.byId', { id: app.id }]);
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess() {
      appQuery.refetch();
    },
  });

  const appDeleteMutation = trpc.useMutation('app.delete', {
    onSuccess() {
      router.push('/');
    },
  });
  const appAccessTokenQuery = trpc.useQuery([
    'appAccessToken.getForCurrentUser',
    { appId: app.id },
  ]);
  const appAccessTokenAddMutation = trpc.useMutation('appAccessToken.add', {
    onSuccess() {
      appAccessTokenQuery.refetch();
    },
  });
  const appAccessTokenDeleteMutation = trpc.useMutation(
    'appAccessToken.delete',
    {
      onSuccess() {
        appAccessTokenQuery.refetch();
      },
    },
  );

  const router = useRouter();
  const [slug, setSlug] = useState<string>(app.slug || '');
  const { slugExists: _slugExists } = useAppSlug(slug);
  const toast = useToast();

  const settingsForm = useForm({
    defaultValues: {
      name: app.name ?? '',
      slug: app.slug,
      description: app.description,
      requiresAuthToRun: app.requiresAuthToRun,
      isPrivate: app.isPrivate,
      isDataSensitive: app.isDataSensitive,
    },
  });
  const model = settingsForm.watch();

  useEffect(() => {
    settingsForm.setValue('slug', app.slug);
  }, [app.slug]);

  useEffect(() => {
    setSlug(slugify(model.slug));
  }, [model.slug]);

  const didModelChange = () => {
    if (!appQuery.data) return false;
    return (
      slug !== appQuery.data.slug ||
      model.name !== appQuery.data.name ||
      model.description !== appQuery.data.description ||
      model.requiresAuthToRun !== appQuery.data.requiresAuthToRun ||
      model.isPrivate !== appQuery.data.isPrivate ||
      model.isDataSensitive !== appQuery.data.isDataSensitive
    );
  };

  const onSubmit = settingsForm.handleSubmit(async (data) => {
    const oldSlug = app.slug;
    const duration = 3000;
    appEditMutation.mutateAsync(
      {
        id: app.id,
        data: {
          slug: settingsForm.getFieldState('slug').isDirty
            ? data.slug
            : undefined,
          name: data.name,
          description: data.description,
          requiresAuthToRun: data.requiresAuthToRun,
          isPrivate: data.isPrivate,
          isDataSensitive: data.isDataSensitive,
        },
      },
      {
        onSuccess: (app) => {
          let description = undefined;
          if (app.slug !== oldSlug) {
            const url = router.asPath.replace(oldSlug, app.slug);
            setTimeout(() => {
              router.replace(url);
            }, duration / 2);
            description = 'Your page will reload';
          }
          toast({
            title: 'App updated.',
            status: 'success',
            duration,
            description,
            isClosable: true,
          });
        },
        onError: () => {
          toast({
            title: 'Error.',
            status: 'error',
            description: 'Could not update the app',
            duration,
            isClosable: true,
          });
        },
      },
    );
  });

  const slugExists = slug === appQuery.data?.slug ? false : _slugExists;
  const disableSave =
    slugExists || slug.length < MIN_SLUG_LENGTH || !didModelChange();
  const appLink = getAppLink(slug);

  const appAccessTokenForm = useForm({ defaultValues: { description: '' } });
  const [showAppAccessToken, setShowAppAccessToken] = useState<
    string | undefined
  >();
  const [isSavingAccessToken, setIsSavingAccessToken] = useState(false);

  const copyToken = async () => {
    await navigator.clipboard.writeText(showAppAccessToken || '');
    toast({
      title: 'App access token copied',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
  };

  const onAppAccessTokenSubmit = async ({
    description,
  }: {
    description: string;
  }) => {
    setIsSavingAccessToken(true);
    const token = await appAccessTokenAddMutation.mutateAsync({
      description,
      appId: app.id,
    });
    setIsSavingAccessToken(false);
    appAccessTokenForm.reset();
    setShowAppAccessToken(token);
  };

  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack flex={1} alignItems="stretch" minW={TITLE_COLUMN_MIN_WIDTH}>
        <Heading as="h6" pb="4" fontWeight={400}>
          Settings
        </Heading>
      </VStack>
      <VStack align="stretch" flex={3} pb="10">
        <Box w="100%">
          <Text fontSize={'xl'}>General</Text>
          <Divider mb="4" mt={2} />
        </Box>
        <FormProvider {...settingsForm}>
          <VStack
            as="form"
            onSubmit={onSubmit}
            flex={3}
            align="stretch"
            spacing={9}
          >
            <FormControl isRequired>
              <FormLabel>Slug</FormLabel>
              <InputGroup>
                <Input
                  backgroundColor="bgColor"
                  maxLength={60}
                  {...settingsForm.register('slug')}
                />
                {slug && slug.length >= MIN_SLUG_LENGTH && (
                  <InputRightElement
                    children={
                      slugExists ? (
                        <Icon as={HiExclamationTriangle} color="red.500" />
                      ) : (
                        <CheckIcon color="green.500" />
                      )
                    }
                  />
                )}
              </InputGroup>
              <FormHelperText display="flex" gap={2} fontSize="sm">
                <Text fontWeight="semibold">Required</Text>
                {settingsForm.watch('slug') && (
                  <Text>Your app will be available at {appLink}</Text>
                )}
              </FormHelperText>
              <FormErrorMessage>
                {settingsForm.formState.errors.slug?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel>Name</FormLabel>
              <Input
                backgroundColor="bgColor"
                maxLength={60}
                {...settingsForm.register('name')}
              />
              <FormErrorMessage>
                {settingsForm.formState.errors.name?.message}
              </FormErrorMessage>
            </FormControl>
            <FormControl>
              <FormLabel textColor="fg.600">Description</FormLabel>
              <Textarea
                backgroundColor="bgColor"
                {...settingsForm.register('description')}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Visibility</FormLabel>
              <VStack
                w="full"
                border="1px solid"
                borderColor="fg.200"
                align={'stretch'}
                spacing="0"
              >
                <HStack
                  w="full"
                  p="4"
                  borderBottom="1px solid"
                  borderColor={'fg.200'}
                >
                  <Flex flexGrow={'1'}>
                    <VStack align="start">
                      <HStack>
                        {settingsForm.watch('isPrivate') ? (
                          <PiLockSimple />
                        ) : (
                          <PiLockSimpleOpen />
                        )}
                        <Text>Is the code private?</Text>
                      </HStack>
                      <FormHelperText maxW="xl">{`Since this is ${
                        settingsForm.watch('isPrivate')
                          ? 'checked, only organization members and people invited to the app will be able to see the source code.'
                          : 'not checked, anyone on the internet will be able to see the source code.'
                      }`}</FormHelperText>
                    </VStack>
                  </Flex>
                  <Switch {...settingsForm.register('isPrivate')} ml="auto" />
                </HStack>

                <VStack
                  w="full"
                  p="4"
                  align="start"
                  borderBottom="1px solid"
                  borderColor={'fg.200'}
                >
                  <VStack align="start" w="full">
                    <HStack w="full">
                      {settingsForm.watch('requiresAuthToRun') ? (
                        <PiLockLaminated />
                      ) : (
                        <PiLockLaminatedOpen />
                      )}
                      <Text>Require auth to run?</Text>
                      <Spacer flexGrow={1} />
                      <Switch {...settingsForm.register('requiresAuthToRun')} />
                    </HStack>
                  </VStack>

                  <FormHelperText maxW="xl">{`Since this is ${
                    settingsForm.watch('requiresAuthToRun')
                      ? 'checked, users will be asked to authenticate before running your applet. You will be able to use the information in Zipper.userInfo to determine who sees the output.'
                      : 'not checked, anyone on the internet will be able to run your applet and see the output.'
                  }`}</FormHelperText>
                </VStack>

                <VStack w="full" p="4" align="start">
                  <VStack align="start" w="full">
                    <HStack w="full">
                      {settingsForm.watch('isDataSensitive') ? (
                        <PiEnvelopeSimple />
                      ) : (
                        <PiEnvelopeSimpleOpen />
                      )}
                      <Text>Is the data sensitive?</Text>
                      <Spacer flexGrow={1} />
                      <Switch {...settingsForm.register('isDataSensitive')} />
                    </HStack>
                  </VStack>

                  <FormHelperText maxW="xl">{`Since this is ${
                    settingsForm.watch('isDataSensitive')
                      ? 'checked, audit logs will not contain any which inputs were used and what output was return.'
                      : 'not checked, audit logs will include the full inputs and output of each function run.'
                  }`}</FormHelperText>
                </VStack>
              </VStack>
            </FormControl>
            <FormControl>
              <Button
                display="block"
                colorScheme="purple"
                type="submit"
                isDisabled={disableSave}
              >
                Save
              </Button>
            </FormControl>
          </VStack>
        </FormProvider>
        <Box w="100%" pt={10}>
          <HStack>
            <Text fontSize={'xl'} flexGrow={1}>
              Your Access Tokens
            </Text>
            <Button
              colorScheme="purple"
              variant="outline"
              onClick={onOpen}
              leftIcon={<PiKeyBold />}
            >
              Generate Token
            </Button>
          </HStack>
          <Divider mb="4" mt={2} />
          {appAccessTokenQuery.isLoading && <Spinner />}
          {appAccessTokenQuery.data &&
            appAccessTokenQuery.data.length === 0 && (
              <VStack
                border="1px solid"
                borderColor="fg.100"
                backgroundColor="fg.50"
                py="10"
                color={'fg.500'}
              >
                <Center verticalAlign={'center'}>
                  You don't have any access tokens yet. Generate one to access
                  this app programmatically.
                </Center>
              </VStack>
            )}
          {appAccessTokenQuery.data && appAccessTokenQuery.data.length > 0 && (
            <>
              <VStack align={'stretch'} border="1px solid" borderColor="fg.100">
                {appAccessTokenQuery.data.map((token) => (
                  <HStack
                    borderBottom={'1px solid'}
                    borderColor="fg.100"
                    _last={{ borderBottom: 'none' }}
                    p="4"
                  >
                    <VStack flexGrow={1} align="start">
                      <Text>{token.description}</Text>
                    </VStack>
                    <IconButton
                      aria-label="Delete token"
                      variant="ghost"
                      icon={<Icon as={PiTrashSimpleBold} color="fg.400" />}
                      onClick={() => {
                        appAccessTokenDeleteMutation.mutateAsync(
                          { identifier: token.identifier },
                          {
                            onSuccess: () => {
                              toast({
                                title: 'Token deleted.',
                                status: 'success',
                                duration: 3000,
                                isClosable: true,
                              });
                            },
                            onError: () => {
                              toast({
                                title: 'Error.',
                                status: 'error',
                                description: 'Could not delete the token',
                                duration: 3000,
                                isClosable: true,
                              });
                            },
                          },
                        );
                      }}
                    />
                  </HStack>
                ))}
              </VStack>
            </>
          )}
        </Box>

        <Box w="100%" pt={10}>
          <HStack>
            <Text fontSize={'xl'} flexGrow={1}>
              Here Be Dragons
            </Text>
          </HStack>
          <Divider mb="4" mt={2} />
          <VStack border="1px solid" borderColor="red.100">
            <VStack w="full" p="4" align="start">
              <VStack align="start" w="full">
                <HStack w="full">
                  <Text>Delete this applet</Text>
                  <Spacer flexGrow={1} />
                  <Button
                    colorScheme="red"
                    variant="outline"
                    onClick={onOpenDeleteConfirmation}
                    leftIcon={<PiTrashSimpleBold />}
                  >
                    Delete applet
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </VStack>
        </Box>
      </VStack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <form
            onSubmit={appAccessTokenForm.handleSubmit(onAppAccessTokenSubmit)}
          >
            <ModalHeader>Generate an App Access Token</ModalHeader>
            <ModalBody>
              {showAppAccessToken ? (
                <VStack align="start">
                  <Text>
                    Copy and save your access token before closing this modal.
                    It won't be shown again.
                  </Text>
                  <HStack w="full">
                    <Input
                      flexGrow={1}
                      isDisabled={true}
                      value={showAppAccessToken}
                    ></Input>
                    <Tooltip label="Copy">
                      <IconButton
                        aria-label="copy"
                        colorScheme="purple"
                        variant="ghost"
                        size="xs"
                        onClick={() => copyToken()}
                      >
                        <PiClipboardBold />
                      </IconButton>
                    </Tooltip>
                  </HStack>
                </VStack>
              ) : (
                <FormControl isRequired>
                  <FormLabel>Description</FormLabel>
                  <Input
                    backgroundColor="bgColor"
                    {...appAccessTokenForm.register('description')}
                  />
                  <FormErrorMessage>
                    {appAccessTokenForm.formState.errors.description?.message}
                  </FormErrorMessage>
                </FormControl>
              )}
            </ModalBody>
            <ModalFooter>
              <Button
                variant="ghost"
                mr={3}
                onClick={() => {
                  onClose();
                  appAccessTokenForm.reset();
                  setShowAppAccessToken(undefined);
                }}
              >
                Close
              </Button>
              {!showAppAccessToken && (
                <Button
                  colorScheme="purple"
                  type="submit"
                  isDisabled={isSavingAccessToken}
                >
                  {isSavingAccessToken ? <Spinner /> : 'Create'}
                </Button>
              )}
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      <AlertDialog
        isOpen={isOpenDeleteConfirmation}
        leastDestructiveRef={cancelRef}
        onClose={onCloseDeleteConfirmation}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Applet
            </AlertDialogHeader>
            <AlertDialogCloseButton />

            <AlertDialogBody>
              <Box>
                You're about to delete this applet. Are you sure?
                <Flex
                  pt="5"
                  fontSize="lg"
                  fontWeight="bold"
                  justifyContent="center"
                >
                  {app.slug}
                </Flex>
              </Box>
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button
                colorScheme="gray"
                _hover={{ bg: 'red.500', color: 'white' }}
                onClick={() =>
                  appDeleteMutation.mutateAsync({
                    id: app.id,
                  })
                }
                w="full"
              >
                {`Delete ${app.slug}`}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </HStack>
  );
};

export default SettingsTab;
