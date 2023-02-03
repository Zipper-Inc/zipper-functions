import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import slugify from '~/utils/slugify';
import { trpc } from '~/utils/trpc';

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

  const settingsForm = useForm({
    defaultValues: {
      name: appQuery.data?.name || '',
      slug: appQuery.data?.slug || '',
      description: appQuery.data?.description || '',
    },
  });

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
                  <Input
                    backgroundColor="white"
                    maxLength={60}
                    {...settingsForm.register('slug')}
                  />
                  {settingsForm.watch('slug') && (
                    <FormHelperText>
                      {`Your app will be available at
                            ${
                              process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                            }/${slugify(settingsForm.watch('slug'))}`}
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
