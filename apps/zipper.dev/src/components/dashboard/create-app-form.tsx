import { CheckIcon, WarningIcon } from '@chakra-ui/icons';
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
  Center,
  Divider,
  Card,
  CardHeader,
  CardBody,
  Grid,
  GridItem,
  Spinner,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiCheck, HiExclamationTriangle } from 'react-icons/hi2';
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
import { useEditorContext } from '../context/editor-context';
import { useAnalytics } from '~/hooks/use-analytics';

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
  requiresAuthToRun: false,
});

const defaultTemplates = [
  {
    id: 'hello-world',
    name: 'Hello World',
    description: '👋',
    shouldFork: false,
  },
  {
    id: 'ai',
    name: 'AI Generated Code',
    description: '🤖✨',
    shouldFork: false,
  },
];

export const CreateAppForm: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { organization } = useOrganization();
  const { user } = useUser();
  const analytics = useAnalytics();
  const { setActive } = useOrganizationList();
  const utils = trpc.useContext();
  const router = useRouter();

  const addScript = trpc.script.add.useMutation();
  const generateCodeWithAI = trpc.ai.pipeline.useMutation();
  const { scripts } = useEditorContext();

  const templatesQuery = trpc.app.templates.useQuery();
  const [templates, setTemplates] = useState<
    {
      id: string;
      name: string | null;
      description: string | null;
      shouldFork: boolean;
    }[]
  >(defaultTemplates);

  const forkTemplate = trpc.app.fork.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.app.byAuthedUser.invalidate();
      if (router.query['resource-owner']) {
        await utils.app.byResourceOwner.invalidate({
          resourceOwnerSlug: router.query['resource-owner'] as string,
        });
      }
    },
  });

  const addApp = trpc.app.add.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.app.byAuthedUser.invalidate();
      if (router.query['resource-owner']) {
        await utils.app.byResourceOwner.invalidate({
          resourceOwnerSlug: router.query['resource-owner'] as string,
        });
      }
    },
  });

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null | undefined
  >(organization?.id);

  const [slug, setSlug] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);

  const [templateSelection, setTemplateSelection] = useState<
    string | undefined
  >('hello-world');

  const createAppForm = useForm({
    defaultValues: getDefaultCreateAppFormValues(),
  });

  useEffect(() => {
    setSlug(slugify(createAppForm.getValues('name')));
  }, []);

  useEffect(() => {
    setSelectedOrganizationId(organization?.id);
  }, [organization?.id]);

  useEffect(() => {
    if (templatesQuery.data) {
      setTemplates([
        ...defaultTemplates,
        ...templatesQuery.data.map((template) => {
          return {
            id: template.id,
            name: template.name,
            description: template.description,
            shouldFork: true,
          };
        }),
      ]);
    }
  }, [templatesQuery.data]);

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

  const toast = useToast();
  const steps = [
    { title: 'First', description: 'Configuration' },
    { title: 'Second', description: 'Initialization' },
  ];

  const [currentStep, setCurrentStep] = useState(0);

  const runAddAppMutation = async ({
    description,
    name,
    isPublic,
    requiresAuthToRun,
  }: {
    name: string;
    description: string;
    isPublic: boolean;
    requiresAuthToRun: boolean;
  }) => {
    const aiOutput =
      templateSelection === 'ai' && description
        ? await generateCodeWithAI.mutateAsync({
            userRequest: description,
          })
        : undefined;

    const mainCode = aiOutput?.find(
      (output) => output.filename === 'main.ts',
    )?.code;

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
            (selectedOrganizationId ?? null) !== (organization?.id ?? null) &&
            setActive
          ) {
            setActive(selectedOrganizationId || null);
          }
          if (aiOutput) {
            const otherFiles = aiOutput.filter(
              (output) => output.filename !== 'main.ts',
            );

            await Promise.allSettled(
              otherFiles.map((output) => {
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
            getEditAppletLink(applet!.resourceOwner!.slug, applet!.slug),
          );
        },
      },
    );
  };

  if (templatesQuery.isLoading) {
    return (
      <Center>
        <Spinner />;
      </Center>
    );
  }

  return (
    <Box position="relative" width="container.md">
      {addApp.isLoading ||
        (generateCodeWithAI.isLoading && (
          <Fade in={addApp.isLoading || generateCodeWithAI.isLoading}>
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
              <Image src="/static/spinner@1x.gif" />
            </AbsoluteCenter>
          </Fade>
        ))}
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

        <VStack align={'start'} spacing={6} w="full">
          <Heading as={'h1'} fontWeight="md" mb="2" mt="4" fontSize="3xl">
            Create Applet
          </Heading>

          <HStack w="full" align="stretch">
            {steps.map((step, index) => {
              const lastItem = index === steps.length - 1;
              return (
                <HStack
                  w={lastItem ? '' : 'full'}
                  flexGrow={lastItem ? 'initial' : 1}
                  flexShrink={lastItem ? 'initial' : 1}
                  flexBasis={lastItem ? 'initial' : 0}
                  onClick={() => setCurrentStep(index)}
                  _hover={{ cursor: 'pointer' }}
                >
                  <Center
                    bg={index === currentStep ? 'primary.500' : 'bg.100'}
                    border="1px solid"
                    borderColor="primary.500"
                    rounded="full"
                    w="7"
                    h="7"
                    flexShrink="0"
                  >
                    {}
                    {index === currentStep ? (
                      <Icon as={HiCheck} fill="white" />
                    ) : (
                      <Text color="fg.600">{index + 1}</Text>
                    )}
                  </Center>
                  <VStack align="start" spacing={0.5} flexShrink="0">
                    <Text>{step.title}</Text>
                    <Text fontSize="sm" color="fg.500">
                      {step.description}
                    </Text>
                  </VStack>
                  {!lastItem && <Box h="0.5" bgColor="primary.200" w="full" />}
                </HStack>
              );
            })}
          </HStack>

          {currentStep === 0 && (
            <>
              <FormControl isRequired>
                <FormLabel>Applet Name</FormLabel>
                <HStack spacing={1}>
                  <Text fontWeight="normal" fontSize="md" color="fg.600">
                    {organization?.name ||
                      (user?.username as string) ||
                      'Personal workspace'}
                  </Text>

                  <InputGroup>
                    <Input
                      autoFocus
                      backgroundColor="bgColor"
                      maxLength={60}
                      {...createAppForm.register('name')}
                      onChange={(e) => setSlug(slugify(e.target.value))}
                    />
                    {isSlugValid ? (
                      <InputRightElement
                        children={
                          slugExists ? (
                            <Icon as={HiExclamationTriangle} color="red.500" />
                          ) : (
                            <CheckIcon color="green.500" />
                          )
                        }
                      />
                    ) : (
                      <InputRightElement
                        children={
                          <Icon as={HiExclamationTriangle} color="red.500" />
                        }
                      />
                    )}
                  </InputGroup>
                </HStack>
                {createAppForm.watch('name') && !slugExists && (
                  <FormHelperText>
                    {`Your app will be available at
                            https://${slug}.zipper.run`}
                  </FormHelperText>
                )}
                {slugExists && (
                  <Text as="span" fontSize="sm" color="red.500">
                    {slug} allready exists
                  </Text>
                )}
              </FormControl>

              <Divider />
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
                      <Switch
                        {...createAppForm.register('requiresAuthToRun')}
                      />
                    </HStack>
                    {createAppForm.watch('requiresAuthToRun') && (
                      <FormHelperText>
                        Users will be asked to authenticate against Zipper
                        before they're able to run your applet. You can use the
                        user's email address to determine if they have access.
                      </FormHelperText>
                    )}
                  </VStack>
                </VStack>
              </FormControl>

              <HStack w="full" justifyContent="end">
                <Button onClick={onClose} variant="ghost">
                  Cancel
                </Button>
                <Button
                  display="block"
                  variant="outline"
                  colorScheme="purple"
                  disabled={slugExists || !createAppForm.formState.isValid}
                  onClick={() => setCurrentStep(currentStep + 1)}
                  isDisabled={!isSlugValid || slugExists ? true : false}
                >
                  Next
                </Button>
              </HStack>
            </>
          )}
          {currentStep === 1 && (
            <>
              <FormControl>
                <HStack spacing={1}>
                  <FormLabel mr="0">Start from a template</FormLabel>
                </HStack>

                <Grid templateColumns="repeat(3, 1fr)" gap="3">
                  {templates.map(({ id, name, description }) => {
                    return (
                      <GridItem>
                        <Card
                          w="250px"
                          h="120px"
                          onClick={() => {
                            setTemplateSelection((curr) => {
                              if (curr === id) return undefined;
                              return id;
                            });
                          }}
                          _hover={{
                            cursor: 'pointer',
                            shadow: 'md',
                            transform: 'translateY(-5px)',
                            transitionDuration: '0.2s',
                            transitionTimingFunction: 'ease-in-out',
                          }}
                          border={
                            templateSelection === id ? '1px solid' : 'none'
                          }
                          borderColor="purple.300"
                        >
                          <CardBody>
                            <Heading
                              as={'h3'}
                              size="sm"
                              fontWeight="medium"
                              mb="2"
                            >
                              {name}
                            </Heading>
                            {description}
                          </CardBody>
                        </Card>
                      </GridItem>
                    );
                  })}
                </Grid>
              </FormControl>
              {templateSelection === 'ai' && (
                <FormControl>
                  <HStack spacing={1}>
                    <FormLabel mr="0">Generate code using AI</FormLabel>
                  </HStack>

                  <FormHelperText mb={4}>
                    Tell us what you'd like your applet to do and we'll use the
                    magic of AI to autogenerate some code to get you started.{' '}
                    <Text fontWeight="bold">
                      This process can take up to a minute.
                    </Text>
                  </FormHelperText>
                  <Textarea
                    autoFocus
                    fontFamily={'mono'}
                    fontSize="sm"
                    height={120}
                    backgroundColor="bgColor"
                    {...createAppForm.register('description')}
                  />
                </FormControl>
              )}
              <HStack w="full" justifyContent="end">
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  Back
                </Button>
                <Button
                  display="block"
                  colorScheme="purple"
                  type="submit"
                  isDisabled={
                    !templateSelection ||
                    (templateSelection === 'ai' &&
                      !createAppForm.getValues().description) ||
                    isDisabled ||
                    addApp.isLoading ||
                    generateCodeWithAI.isLoading ||
                    submitting
                  }
                  onClick={createAppForm.handleSubmit(async (data) => {
                    setSubmitting(true);

                    const selectedTemplate = templates.find(
                      (t) => t.id === templateSelection,
                    );
                    if (selectedTemplate?.shouldFork) {
                      await forkTemplate.mutateAsync(
                        {
                          id: selectedTemplate.id,
                          name: data.name,
                          connectToParent: false,
                        },
                        {
                          onSuccess: (applet) => {
                            resetForm();

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
                    } else {
                      await runAddAppMutation(data);
                    }
                  })}
                >
                  {templateSelection === 'ai' &&
                  createAppForm.watch('description')
                    ? 'Generate ✨'
                    : 'Create'}
                </Button>
              </HStack>
            </>
          )}
        </VStack>
      </FormProvider>
    </Box>
  );
};
