import { CopyIcon } from '@chakra-ui/icons';
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
  Avatar,
  useClipboard,
} from '@chakra-ui/react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { HiGlobe } from 'react-icons/hi';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const ShareTab: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const appQuery = trpc.useQuery(['app.byId', { id: appId }]);
  const editorQuery = trpc.useQuery(['appEditor.all', { appId }]);
  const invitationForm = useForm();

  const { onCopy, hasCopied } = useClipboard(
    `${window.location.origin}/app/${appId}`,
  );

  const inviteEditor = trpc.useMutation('appEditor.invite', {
    async onSuccess() {
      // refetches posts after a post is added
      editorQuery.refetch();
    },
  });

  const setAppVisibility = trpc.useMutation('app.edit', {
    onSuccess() {
      appQuery.refetch();
    },
  });

  const onSubmit = async (data: FieldValues) => {
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
                            fontSize="sm"
                            {...invitationForm.register('email')}
                            type="email"
                            placeholder="Email"
                          />
                          <Button px={6} type="submit" fontSize="sm">
                            Send invite
                          </Button>
                        </HStack>
                      </form>
                      <Box w="full">
                        <VStack align="start">
                          <HStack pt={4} w="full">
                            <Box mr="auto">
                              <HStack>
                                <HiGlobe />
                                <Text>
                                  Anyone with the link can view the app
                                </Text>
                              </HStack>
                            </Box>
                            {appQuery.data && (
                              <Switch
                                isChecked={!appQuery.data.isPrivate}
                                onChange={async () => {
                                  await setAppVisibility.mutateAsync({
                                    id: appId,
                                    data: {
                                      isPrivate: !appQuery.data.isPrivate,
                                    },
                                  });
                                }}
                                ml="auto"
                              />
                            )}
                          </HStack>
                          <Text color="gray.500" fontSize="sm" pt="4">
                            Existing editors
                          </Text>
                          <Box p="2">
                            {editorQuery.data &&
                              editorQuery.data.map((editor) => (
                                <Box fontSize="sm" key={editor.user.id}>
                                  <HStack>
                                    <Avatar
                                      size="xs"
                                      src={editor.user.picture || undefined}
                                      name={
                                        editor.user.name || editor.user.email
                                      }
                                    />
                                    <Text>{editor.user.email}</Text>
                                  </HStack>
                                </Box>
                              ))}
                          </Box>
                        </VStack>
                      </Box>
                    </VStack>
                  </Box>
                </>
              </VStack>
            </ModalBody>

            <ModalFooter mt={4}>
              <Link href="#" mr="auto" color={'blue.700'} onClick={onCopy}>
                <CopyIcon mr={1} mb={1} />
                {hasCopied ? 'Copied!' : 'Copy link'}
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

export default ShareTab;
