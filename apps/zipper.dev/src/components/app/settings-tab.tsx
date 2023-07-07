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
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';

import { inferQueryOutput, trpc } from '~/utils/trpc';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from 'slugify';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { useRouter } from 'next/router';
import {
  HiLockOpen,
  HiLockClosed,
  HiOutlineClipboard,
  HiOutlineTrash,
} from 'react-icons/hi';
import { VscCode } from 'react-icons/vsc';
import { getAppLink } from '@zipper/utils';

type Props = {
  app: Pick<
    Unpack<inferQueryOutput<'app.byId'>>,
    'id' | 'name' | 'slug' | 'description' | 'requiresAuthToRun' | 'isPrivate'
  >;
};

const SettingsTab: React.FC<Props> = ({ app }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const appQuery = trpc.useQuery(['app.byId', { id: app.id }]);
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess() {
      appQuery.refetch();
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
      isPublic: !app.isPrivate,
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
      model.isPublic !== !appQuery.data.isPrivate
    );
  };

  const onSubmit = settingsForm.handleSubmit(async (data) => {
    const oldSlug = app.slug;
    const duration = 3000;
    appEditMutation.mutateAsync(
      {
        id: app.id,
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description,
          requiresAuthToRun: data.requiresAuthToRun,
          isPrivate: !data.isPublic,
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
      <VStack flex={1} alignItems="stretch">
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
                rounded="md"
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
                        <VscCode />
                        <Text>Is the code public?</Text>
                      </HStack>
                      <FormHelperText maxW="xl">{`With this field ${
                        settingsForm.watch('isPublic')
                          ? 'checked, anyone on the internet will be able to see the source code.'
                          : 'unchecked, only organization members and people invited to the app will be able to see the source code.'
                      }`}</FormHelperText>
                    </VStack>
                  </Flex>
                  <Switch {...settingsForm.register('isPublic')} ml="auto" />
                </HStack>

                <VStack w="full" p="4" align="start">
                  <VStack align="start" w="full">
                    <HStack w="full">
                      {settingsForm.watch('requiresAuthToRun') ? (
                        <HiLockClosed />
                      ) : (
                        <HiLockOpen />
                      )}
                      <Text>Require auth to run?</Text>
                      <Spacer flexGrow={1} />
                      <Switch {...settingsForm.register('requiresAuthToRun')} />
                    </HStack>
                  </VStack>

                  <FormHelperText maxW="xl">{`With this field ${
                    settingsForm.watch('requiresAuthToRun')
                      ? 'checked, users will be asked to authenticate before running your applet. You will be able to use the information in Zipper.userInfo to determine who sees the output.'
                      : 'unchecked, anyone on the internet will be able to run your applet and see the output.'
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
            <Button colorScheme="purple" variant="outline" onClick={onOpen}>
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
                borderRadius={'lg'}
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
              <VStack
                align={'stretch'}
                border="1px solid"
                borderColor="fg.100"
                borderRadius={'lg'}
              >
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
                      icon={<Icon as={HiOutlineTrash} color="fg.400" />}
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
                        <HiOutlineClipboard />
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
    </HStack>
  );
};

export default SettingsTab;
