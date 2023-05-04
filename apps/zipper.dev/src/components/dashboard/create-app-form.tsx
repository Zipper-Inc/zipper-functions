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
  BreadcrumbSeparator,
  BreadcrumbLink,
  Heading,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from '~/utils/slugify';
import { trpc } from '~/utils/trpc';
import { generateDefaultSlug } from '~/utils/generate-default';
import { HiGlobe } from 'react-icons/hi';
import { useOrganization, useOrganizationList, useUser } from '@clerk/nextjs';
import { OrganizationSelector } from './organization-selector';
import { useAppSlug, MIN_SLUG_LENGTH } from '~/hooks/use-app-slug';
import { VscCode } from 'react-icons/vsc';
import { useToast } from '@chakra-ui/react';

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
  canAnyoneRun: true,
});

export const CreateAppForm: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => {
  const { organization } = useOrganization();
  const { user } = useUser();
  const { setActive } = useOrganizationList();
  const utils = trpc.useContext();
  const addApp = trpc.useMutation('app.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byAuthedUser']);
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

  return (
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
            <Text fontWeight="medium" fontSize="lg" color="gray.600">
              {organization?.name ||
                (user?.publicMetadata.username as string) ||
                'Personal workspace'}
            </Text>
            <Text>/</Text>
            <InputGroup>
              <Input
                backgroundColor="white"
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
          <FormLabel textColor="gray.600">Description</FormLabel>
          <Textarea
            backgroundColor="white"
            {...createAppForm.register('description')}
          />
        </FormControl>
        <FormControl>
          <FormLabel>Visibility</FormLabel>
          <VStack
            w="full"
            border="1px solid"
            borderColor="gray.200"
            rounded="md"
            align={'stretch'}
            spacing="0"
          >
            <HStack
              w="full"
              p="4"
              borderBottom="1px solid"
              borderColor={'gray.200'}
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
                <HiGlobe />
                <Text>Is the output of the app public?</Text>
                <Spacer flexGrow={1} />
                <Switch {...createAppForm.register('canAnyoneRun')} />
              </HStack>
              {!createAppForm.watch('canAnyoneRun') && (
                <FormHelperText>
                  Users will be asked to authenticate against Zipper before
                  they're able to run your app. You can use the user's email
                  address to determine if they have access.
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
            isDisabled={isDisabled || addApp.isLoading}
            onClick={createAppForm.handleSubmit(
              async ({ description, isPublic, canAnyoneRun, name }) => {
                await addApp.mutateAsync(
                  {
                    description,
                    name,
                    isPrivate: !isPublic,
                    requiresAuthToRun: !canAnyoneRun,
                    organizationId: selectedOrganizationId,
                  },
                  {
                    onSuccess: () => {
                      resetForm();
                      if (
                        (selectedOrganizationId ?? null) !==
                          (organization?.id ?? null) &&
                        setActive
                      ) {
                        setActive({
                          organization: selectedOrganizationId,
                        });
                      }
                      toast({
                        title: 'Applet created',
                        status: 'success',
                        duration,
                        isClosable: true,
                      });
                      onClose();
                    },
                  },
                );
              },
            )}
          >
            Create
          </Button>
        </HStack>
      </VStack>
    </FormProvider>
  );
};
