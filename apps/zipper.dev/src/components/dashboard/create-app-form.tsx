import { CheckIcon } from '@chakra-ui/icons';
import {
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Icon,
  Text,
  Textarea,
  VStack,
  HStack,
  Switch,
  Flex,
  Spacer,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  Box,
  AbsoluteCenter,
  Image,
  Fade,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from '~/utils/slugify';
import { trpc } from '~/utils/trpc';
import { generateDefaultSlug } from '~/utils/generate-default';
import { HiLockOpen, HiLockClosed } from 'react-icons/hi';
import { useAppSlug, MIN_SLUG_LENGTH } from '~/hooks/use-app-slug';
import { VscCode } from 'react-icons/vsc';
import { useToast } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useOrganization } from '~/hooks/use-organization';
import { useUser } from '~/hooks/use-user';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { getEditAppletLink } from '@zipper/utils';
import { ChatGPTMessage } from '~/app/aifunctions/route';
import { AICodeOutput } from '@zipper/types';
import { useEditorContext } from '../context/editor-context';

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
  requiresAuthToRun: false,
});

export const CreateAppForm: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { setActive } = useOrganizationList();
  const utils = trpc.useContext();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatGPTMessage[]>([]);
  const [isSending, setIsSending] = useState(false);

  const addScript = trpc.useMutation('script.add');
  const { scripts } = useEditorContext();

  const getZipperCode = async ({
    message,
    basicCode,
  }: {
    message: string;
    basicCode: string;
  }) => {
    const response = await fetch('/aifunctions/zipperCode', {
      method: 'POST',
      body: JSON.stringify({
        userRequest: message,
        rawTypescriptCode: basicCode,
      }),
    });

    // Handle response
    const data = await response.json();

    if (data.error) {
      console.log(data.error);
      throw new Error('Failed to generate Zipper code');
    }

    return data as { raw: string; groupedByFilename: AICodeOutput[] };
  };

  // getBasicCode implementation
  const getBasicCode = async (message: string): Promise<ChatGPTMessage> => {
    const response = await fetch('/aifunctions/generate', {
      method: 'POST',
      body: JSON.stringify({
        userRequest: message,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return data.message;
  };

  const sendMessageHandler = async (message: string) => {
    // Existing logic to build messages
    const messagesToSend: ChatGPTMessage[] = [
      ...messages,
      { role: 'user', content: message },
    ];

    setIsSending(true);

    try {
      const basicCodeResponse = await getBasicCode(message);
      const basicCode = basicCodeResponse.content;
      const zipperCode = await getZipperCode({ message, basicCode });

      console.log(zipperCode);

      setMessages([
        ...messagesToSend,
        { role: 'assistant', content: basicCode },
        { role: 'assistant', content: zipperCode.raw },
      ]);

      return zipperCode;
    } catch (error) {
      console.log(error);
    } finally {
      setIsSending(false);
    }
  };

  const addApp = trpc.useMutation('app.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byAuthedUser']);
      if (router.query['resource-owner']) {
        await utils.invalidateQueries([
          'app.byResourceOwner',
          { resourceOwnerSlug: router.query['resource-owner'] as string },
        ]);
      }
    },
  });

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null | undefined
  >(organization?.id);

  const [slug, setSlug] = useState<string>('');

  const createAppForm = useForm({
    defaultValues: getDefaultCreateAppFormValues(),
  });

  useEffect(() => {
    setSlug(slugify(createAppForm.getValues('name')));
  }, []);

  useEffect(() => {
    setSelectedOrganizationId(organization?.id);
  }, [organization?.id]);

  const resetForm = () => {
    const defaultValue = getDefaultCreateAppFormValues();
    createAppForm.reset(defaultValue);
    setSlug(slugify(defaultValue.name));
    setSelectedOrganizationId(organization?.id);
  };

  const { slugExists, appSlugQuery } = useAppSlug(slug);
  const isSlugValid =
    appSlugQuery.isFetched && slug && slug.length >= MIN_SLUG_LENGTH;
  const isDisabled = slugExists || slug.length < MIN_SLUG_LENGTH;

  const duration = 1500;
  const toast = useToast();

  // Gif center above/ modal
  return (
    <Box position="relative">
      <Fade in={isSending}>
        <Box
          position="fixed"
          top={0}
          left={0}
          zIndex={100}
          w="100vw"
          h="100vh"
          backgroundColor="blackAlpha.600"
        />
        <AbsoluteCenter axis="both" zIndex={110}>
          <Image src="/static/spinner-dark@1x.gif" />
        </AbsoluteCenter>
      </Fade>
      <FormProvider {...createAppForm}>
        <Breadcrumb>
          <Breadcrumb fontSize="sm">
            <BreadcrumbItem>
              <BreadcrumbLink href="#" onClick={onClose}>
                Applets
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbItem isCurrentPage>
              <Text>Create</Text>
            </BreadcrumbItem>
          </Breadcrumb>
        </Breadcrumb>
        <VStack align={'start'} gap={2} w="full">
          <Heading as={'h1'} fontWeight="md" mb="2" mt="4" fontSize="3xl">
            Create Applet
          </Heading>
          <FormControl isRequired>
            <FormLabel>Name</FormLabel>
            <HStack spacing={1}>
              <Text fontWeight="medium" fontSize="lg" color="fg.600">
                {organization?.name ||
                  (user?.username as string) ||
                  'Personal workspace'}
              </Text>
              <Text>/</Text>
              <InputGroup>
                <Input
                  backgroundColor="bgColor"
                  maxLength={60}
                  {...createAppForm.register('name')}
                  onChange={(e) => {
                    setSlug(slugify(e.target.value));
                  }}
                />
                {isSlugValid && (
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
            </HStack>
            {createAppForm.watch('name') && (
              <FormHelperText>
                {`Your app will be available at
                            ${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`}
              </FormHelperText>
            )}
            <FormErrorMessage>
              {createAppForm.formState.errors.name?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel textColor="gray.600">
              What is your applet about?
            </FormLabel>
            <FormHelperText mb={2}>
              {`Zipper wil use the magic of AI to autogenerate some code to get you started`}
            </FormHelperText>
            <Textarea
              backgroundColor="bgColor"
              {...createAppForm.register('description')}
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
                  </VStack>
                </Flex>
                <Switch {...createAppForm.register('isPublic')} ml="auto" />
              </HStack>

              <VStack align="start" w="full" p="4">
                <HStack w="full">
                  {createAppForm.watch('requiresAuthToRun') ? (
                    <HiLockClosed />
                  ) : (
                    <HiLockOpen />
                  )}
                  <Text>Require sign in to run?</Text>
                  <Spacer flexGrow={1} />
                  <Switch {...createAppForm.register('requiresAuthToRun')} />
                </HStack>
                {createAppForm.watch('requiresAuthToRun') && (
                  <FormHelperText>
                    Users will be asked to authenticate against Zipper before
                    they're able to run your applet. You can use the user's
                    email address to determine if they have access.
                  </FormHelperText>
                )}
              </VStack>
            </VStack>
          </FormControl>
          <HStack w="full" justifyContent="end">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              display="block"
              colorScheme="purple"
              type="submit"
              isDisabled={isDisabled || addApp.isLoading || isSending}
              onClick={createAppForm.handleSubmit(
                async ({ description, isPublic, requiresAuthToRun, name }) => {
                  const aiOutput = description
                    ? await sendMessageHandler(description)
                    : undefined;
                  const mainCode =
                    aiOutput?.groupedByFilename.find(
                      (output) => output.filename === 'main',
                    )?.code || aiOutput?.raw;

                  await addApp.mutateAsync(
                    {
                      description,
                      name,
                      isPrivate: !isPublic,
                      requiresAuthToRun,
                      organizationId: selectedOrganizationId,
                      aiCode: mainCode,
                    },
                    {
                      onSuccess: async (applet) => {
                        resetForm();
                        if (
                          (selectedOrganizationId ?? null) !==
                            (organization?.id ?? null) &&
                          setActive
                        ) {
                          setActive(selectedOrganizationId || null);
                        }
                        if (aiOutput) {
                          const filteredOutput = aiOutput.groupedByFilename.filter((output) => output.filename !== 'main.ts');
                        
                          await Promise.allSettled(
                            filteredOutput.map((output) => {
                              return addScript.mutateAsync({
                                name: output.filename,
                                appId: applet!.id,
                                order: scripts.length + 1,
                                code: output.code,
                              });
                            }),
                          );
                        }

                        toast({
                          title: 'Applet created',
                          status: 'success',
                          duration: 9999,
                          isClosable: false,
                        });

                        router.push(
                          getEditAppletLink(
                            applet!.resourceOwner!.slug,
                            applet!.slug,
                          ),
                        );
                      },
                    },
                  );
                },
              )}
            >
              {createAppForm.watch('description') ? 'Generate ✨' : 'Create'}
            </Button>
          </HStack>
        </VStack>
      </FormProvider>
    </Box>
  );
};
