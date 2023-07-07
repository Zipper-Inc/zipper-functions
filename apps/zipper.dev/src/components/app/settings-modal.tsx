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
import { useRunAppContext } from '../context/run-app-context';

const MIN_SLUG_LENGTH = 5;

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const SettingsTab: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const { appInfo } = useRunAppContext();
  const utils = trpc.useContext();
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess(data) {
      utils.invalidateQueries([
        'app.byResourceOwnerAndAppSlugs',
        { appSlug: appInfo.slug, resourceOwnerSlug: data.resourceOwner.slug },
      ]);
    },
  });

  const [slugExists, setSlugExists] = useState<boolean | undefined>(false);
  const [slug, setSlug] = useState<string>(appInfo.slug || '');
  const [debouncedSlug] = useDebounce(slug, 200);

  const appSlugQuery = trpc.useQuery(
    ['app.validateSlug', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length >= MIN_SLUG_LENGTH) },
  );

  const settingsForm = useForm({
    defaultValues: {
      name: appInfo.name || '',
      slug: appInfo.slug || '',
      description: appInfo.description || '',
    },
  });

  useEffect(() => {
    if (slug === appInfo.slug) {
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
          settingsForm.reset();
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
                      backgroundColor="bgColor"
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
                    backgroundColor="bgColor"
                    maxLength={60}
                    {...settingsForm.register('name')}
                  />
                  <FormErrorMessage>
                    {settingsForm.formState.errors.name?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel textColor="fg600">Description</FormLabel>
                  <Textarea
                    backgroundColor="bgColor"
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
