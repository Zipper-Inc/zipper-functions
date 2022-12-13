import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Switch,
  Text,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiOutlineBeaker } from 'react-icons/hi';
import { trpc } from '~/utils/trpc';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const SettingsModal: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const appQuery = trpc.useQuery(['app.byId', { id: appId }]);
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess() {
      appQuery.refetch();
    },
  });

  const settingsForm = useForm({
    defaultValues: {
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
                  <FormErrorMessage>
                    {settingsForm.formState.errors.slug?.message}
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
                    colorScheme="blue"
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
                <Divider />
                <Text mb="4" textColor="gray.600">
                  Advanced configuration
                </Text>
                <VStack
                  backgroundColor="gray.100"
                  p={2}
                  borderRadius={4}
                  w="full"
                >
                  <HStack w="full">
                    <Box mr="auto">
                      <HStack>
                        <Box p={2}>
                          <HiOutlineBeaker />
                        </Box>
                        <VStack align="start" spacing={1}>
                          <Text>Render output of `main` automatically</Text>
                          <Text textColor="gray.500" fontSize="sm">
                            Inject code that renders the output of your `main`
                            function
                          </Text>
                        </VStack>
                      </HStack>
                    </Box>
                    <Switch isChecked ml="auto" />
                  </HStack>
                </VStack>
              </VStack>
            </ModalBody>
            <ModalFooter />
          </ModalContent>
        </FormProvider>
      </Modal>
    </>
  );
};

export default SettingsModal;
