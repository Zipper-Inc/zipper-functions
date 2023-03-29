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
  Tooltip,
  FormControl,
  FormLabel,
  Spacer,
} from '@chakra-ui/react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { useEffect, useState } from 'react';
import { VscCode } from 'react-icons/vsc';
import { useOrganization, useOrganizations, useUser } from '@clerk/nextjs';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const ShareTab: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const appQuery = trpc.useQuery(['app.byId', { id: appId }]);
  const editorQuery = trpc.useQuery([
    'appEditor.all',
    { appId, includeUsers: true },
  ]);

  const [org, setOrg] = useState<any>();

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

  const setAppVisibility = trpc.useMutation('app.edit');

  const [isPrivate, setIsPrivate] = useState(appQuery.data?.isPrivate);

  const { getOrganization } = useOrganizations();

  useEffect(() => {
    setIsPrivate(appQuery.data?.isPrivate);
    if (appQuery.data?.organizationId && getOrganization) {
      getOrganization(appQuery.data.organizationId).then((o) => setOrg(o));
    }
  }, [appQuery.data]);

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
            <ModalBody p="0">
              <VStack align={'start'}>
                <>
                  <Box mb={4} w="full">
                    <VStack align={'start'}>
                      <form
                        onSubmit={invitationForm.handleSubmit(onSubmit)}
                        style={{ width: '100%' }}
                      >
                        <FormControl px="6" pt="2" pb="0.5">
                          <FormLabel>Invite someone to edit this app</FormLabel>
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
                        </FormControl>
                      </form>
                      <Box w="full" px="7" pb="2">
                        <VStack align="start">
                          <Text
                            color="gray.500"
                            fontSize="sm"
                            pt="4"
                            fontWeight="medium"
                          >
                            Existing editors
                          </Text>
                          <Box p="2" pb="0">
                            <>
                              {org && (
                                <Box fontSize="sm" pb="2">
                                  <HStack>
                                    <Avatar size="xs" name={org.name} />
                                    <Text>Everyone at {org.name}</Text>
                                  </HStack>
                                </Box>
                              )}
                              {editorQuery.data &&
                                editorQuery.data.map((editor, i) => (
                                  <Box
                                    fontSize="sm"
                                    key={editor.user?.id || i}
                                    pb="2"
                                  >
                                    <HStack>
                                      <Avatar
                                        size="xs"
                                        src={
                                          editor.user?.profileImageUrl ||
                                          undefined
                                        }
                                        name={
                                          editor.user?.fullName ||
                                          editor.user?.primaryEmailAddress
                                        }
                                      />
                                      <Tooltip
                                        label={editor.user?.primaryEmailAddress}
                                      >
                                        <Text>
                                          {editor.user?.fullName ||
                                            editor.user?.primaryEmailAddress}
                                        </Text>
                                      </Tooltip>
                                    </HStack>
                                  </Box>
                                ))}
                            </>
                          </Box>
                        </VStack>
                      </Box>
                      <Divider />
                      <VStack align="start" px="6" w="full">
                        <HStack pt={4} w="full">
                          <Box mr="auto">
                            <HStack>
                              <VscCode />
                              <Text>Share the code publicly</Text>
                            </HStack>
                          </Box>
                          <Spacer flexGrow={1} />
                          {appQuery.data && (
                            <Switch
                              isChecked={!isPrivate}
                              onChange={async () => {
                                console.log(isPrivate);
                                setAppVisibility.mutateAsync({
                                  id: appId,
                                  data: {
                                    isPrivate: !isPrivate,
                                  },
                                });
                                setIsPrivate(!isPrivate);
                              }}
                              ml="auto"
                            />
                          )}
                        </HStack>
                        {isPrivate ? (
                          <Text fontSize={'sm'} color="gray.600">
                            When unchecked, the code is only visible to
                            organization members and people invited to edit
                          </Text>
                        ) : (
                          <Text fontSize={'sm'} color="gray.600">
                            When checked, the code is visible to anyone on the
                            internet with the link.
                          </Text>
                        )}
                      </VStack>
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
                colorScheme="purple"
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
