import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  VStack,
  Box,
  Text,
  Divider,
  HStack,
  Input,
  Link,
  Switch,
  FormControl,
} from '@chakra-ui/react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const ShareModal: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const appQuery = trpc.useQuery(['app.byId', { id: appId }]);
  const editorQuery = trpc.useQuery(['appEditor.all', { appId }]);
  const invitationForm = useForm();

  const inviteEditor = trpc.useMutation('appEditor.invite', {
    async onSuccess() {
      // refetches posts after a post is added
      editorQuery.refetch();
    },
  });

  const onSubmit = async (data: FieldValues) => {
    console.log('HERE');
    await inviteEditor.mutateAsync({
      appId,
      email: data.email,
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          onClose();
        }}
        size="xl"
      >
        <FormProvider {...invitationForm}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Share</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align={'start'}>
                <>
                  <Box mb={4} w="full">
                    <Text mb="4">Manage who has access to this app</Text>
                    <Divider my="4" />
                    <VStack align={'start'}>
                      <form
                        onSubmit={invitationForm.handleSubmit(onSubmit)}
                        style={{ width: '100%' }}
                      >
                        <HStack w="full">
                          <Input
                            {...invitationForm.register('email')}
                            type="email"
                            placeholder="Email"
                          />
                          <Button type="submit">Send invite</Button>
                        </HStack>
                      </form>
                      <Box>
                        <VStack align="start">
                          <HStack>
                            <Text>Anyone with the link</Text>
                            {appQuery.data && (
                              <Switch isChecked={!appQuery.data.isPrivate} />
                            )}
                          </HStack>
                          {editorQuery.data &&
                            editorQuery.data.map((editor) => (
                              <Text>{editor.user.email}</Text>
                            ))}
                        </VStack>
                      </Box>
                    </VStack>
                  </Box>
                </>
              </VStack>
            </ModalBody>

            <ModalFooter mt={4}>
              <Link href="#" mr="auto">
                Copy link
              </Link>
              <Button
                type="submit"
                colorScheme="blue"
                onClick={() => {
                  onClose();
                }}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </FormProvider>
      </Modal>
    </>
  );
};

export default ShareModal;
