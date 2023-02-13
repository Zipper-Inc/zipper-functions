import { CheckIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Icon,
  Text,
  Textarea,
  VStack,
  HStack,
  Switch,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { useDebounce } from 'use-debounce';
import slugify from '~/utils/slugify';
import { trpc } from '~/utils/trpc';
import { generateDefaultName } from '~/utils/generate-default';
import { HiGlobe } from 'react-icons/hi';
import { useOrganization, useOrganizationList } from '@clerk/nextjs';
import { OrganizationSelector } from './organization-selector';

const MIN_SLUG_LENGTH = 5;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultName(),
  description: '',
  isPublic: false,
});

export const CreateAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { organization } = useOrganization();
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
  const [debouncedSlug] = useDebounce(slug, 200);

  const appSlugQuery = trpc.useQuery(
    ['app.validateSlug', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length >= MIN_SLUG_LENGTH) },
  );

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

  const slugExists = appSlugQuery.data;
  const isSlugValid =
    appSlugQuery.isFetched && slug && slug.length >= MIN_SLUG_LENGTH;
  const isDisabled = slugExists || slug.length < MIN_SLUG_LENGTH;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
        }}
        size="xl"
      >
        <FormProvider {...createAppForm}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>New App</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align={'start'} gap={2}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <HStack spacing={1}>
                    <OrganizationSelector
                      setSelectedOrganizationId={setSelectedOrganizationId}
                      selectedOrganizationId={selectedOrganizationId}
                    />
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
                              <Icon
                                as={HiExclamationTriangle}
                                color="red.500"
                              />
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
                  <HStack pt={4} w="full">
                    <Box mr="auto">
                      <HStack>
                        <HiGlobe />
                        <Text>Anyone with the link can view the app</Text>
                      </HStack>
                    </Box>
                    <Switch {...createAppForm.register('isPublic')} ml="auto" />
                  </HStack>
                </FormControl>
                <Box w="full">
                  <Button
                    ml="auto"
                    display="block"
                    colorScheme="purple"
                    type="submit"
                    isDisabled={isDisabled}
                    onClick={createAppForm.handleSubmit(
                      async ({ description, isPublic, name }) => {
                        await addApp.mutateAsync(
                          {
                            description,
                            name,
                            isPrivate: !isPublic,
                            organizationId: selectedOrganizationId,
                          },
                          {
                            onSuccess: () => {
                              resetForm();
                              onClose();
                              if (
                                (selectedOrganizationId ?? null) !==
                                  (organization?.id ?? null) &&
                                setActive
                              ) {
                                setActive({
                                  organization: selectedOrganizationId,
                                });
                              }
                            },
                          },
                        );
                      },
                    )}
                  >
                    Create
                  </Button>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter />
          </ModalContent>
        </FormProvider>
      </Modal>
    </>
  );
};
