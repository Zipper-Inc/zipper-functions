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
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { useDebounce } from 'use-debounce';
import slugify from '~/utils/slugify';
import { trpc } from '~/utils/trpc';

const MIN_SLUG_LENGTH = 5;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const SettingsTab: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const appQuery = trpc.useQuery(['app.byId', { id: appId }]);
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess() {
      appQuery.refetch();
    },
  });

  const [slugExists, setSlugExists] = useState<boolean | undefined>();
  const [slug, setSlug] = useState<string>('');
  const [debouncedSlug] = useDebounce(slug, 200);

  const appSlugQuery = trpc.useQuery(
    ['app.validateSlug', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length >= MIN_SLUG_LENGTH) },
  );

  const settingsForm = useForm({
    defaultValues: {
      name: appQuery.data?.name || '',
      slug: appQuery.data?.slug || '',
      description: appQuery.data?.description || '',
    },
  });

  useEffect(() => {
    if (slug === appQuery.data?.slug) {
      setSlugExists(false);
    } else {
      setSlugExists(!appSlugQuery.data);
    }
  }, [appSlugQuery.data]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
        }}
        size="xl"
      >
        <FormProvider {...settingsForm}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Settings</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align={'start'} gap={2}>
                <FormControl isRequired>
                  <FormLabel>Slug</FormLabel>
                  <InputGroup>
                    <Input
                      backgroundColor="white"
                      maxLength={60}
                      {...settingsForm.register('slug')}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                      }}
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
                  {settingsForm.watch('slug') && (
                    <FormHelperText>
                      {`Your app will be available at
                            ${slugify(slug)}.${
                        process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                      }`}
                    </FormHelperText>
                  )}
                  <FormErrorMessage>
                    {settingsForm.formState.errors.slug?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel>Name</FormLabel>
                  <Input
                    backgroundColor="white"
                    maxLength={60}
                    {...settingsForm.register('name')}
                  />
                  <FormErrorMessage>
                    {settingsForm.formState.errors.name?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel textColor="gray.600">Description</FormLabel>
                  <Textarea
                    backgroundColor="white"
                    {...settingsForm.register('description')}
                  />
                </FormControl>
                <Box w="full">
                  <Button
                    ml="auto"
                    display="block"
                    colorScheme="purple"
                    type="submit"
                    isDisabled={slugExists || slug.length < MIN_SLUG_LENGTH}
                    onClick={settingsForm.handleSubmit(async (data) => {
                      appEditMutation.mutateAsync(
                        {
                          id: appId,
                          data: {
                            slug: data.slug,
                            description: data.description,
                          },
                        },
                        {
                          onSuccess: (data) => {
                            settingsForm.reset({
                              slug: data.slug,
                              description: data.description || '',
                            });
                            onClose();
                          },
                        },
                      );
                    })}
                  >
                    Save
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

export default SettingsTab;
