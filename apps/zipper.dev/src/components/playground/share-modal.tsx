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
  useToast,
  InputRightElement,
  InputGroup,
} from '@chakra-ui/react';
import { FieldValues, FormProvider, useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { useEffect, useState } from 'react';
import { VscCode } from 'react-icons/vsc';
import { useRouter } from 'next/router';
import { useUser } from '~/hooks/use-user';
import { ResourceOwnerType } from '@zipper/types';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  appId: string;
};

const ShareTab: React.FC<Props> = ({ isOpen, onClose, appId }) => {
  const { user } = useUser();
  const router = useRouter();
  const appQuery = trpc.app.byResourceOwnerAndAppSlugs.useQuery({
    resourceOwnerSlug: router.query['resource-owner'] as string,
    appSlug: router.query['app-slug'] as string,
  });
  const resourceOwnerNameQuery = trpc.resourceOwnerSlug.getName.useQuery(
    { slug: router.query['resource-owner'] as string },
    {
      enabled:
        appQuery.data?.resourceOwner.resourceOwnerType ===
        ResourceOwnerType.Organization,
    },
  );
  const editorQuery = trpc.appEditor.all.useQuery(
    { appId, includeUsers: true },
    { enabled: !!user },
  );

  const invitationForm = useForm();

  const playgroundUrl = `${window.location.origin}/${router.query['resource-owner']}/${router.query['app-slug']}`;
  const appletUrl = `https://${router.query['app-slug']}.zipper.run`;
  const { onCopy, hasCopied } = useClipboard(playgroundUrl);
  const { onCopy: onCopyApplet, hasCopied: hasCopiedApplet } =
    useClipboard(appletUrl);

  const inviteEditor = trpc.appEditor.invite.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      editorQuery.refetch();
    },
  });

  const removeEditor = trpc.appEditor.deletePendingInvitation.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      editorQuery.refetch();
    },
  });

  const setAppVisibility = trpc.app.edit.useMutation();

  const [isPrivate, setIsPrivate] = useState(appQuery.data?.isPrivate);

  useEffect(() => {
    setIsPrivate(appQuery.data?.isPrivate);
  }, [appQuery.data]);

  const toast = useToast();

  const onSubmit = async (data: FieldValues) => {
    const status = await inviteEditor.mutateAsync({
      appId,
      email: data.email,
    });

    if (status === 'error') {
      toast({
        title: 'Something went awry.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    if (status === 'added') {
      toast({
        title: 'Editor added.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }

    if (status === 'pending') {
      toast({
        title: 'Editor invited.',
        description:
          'They will receive an email with instructions to accept the invitation.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    }
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
              {appQuery.data?.canUserEdit ? (
                <VStack align={'start'}>
                  <>
                    <Box mb={4} w="full">
                      <VStack align={'stretch'}>
                        <form
                          onSubmit={invitationForm.handleSubmit(onSubmit)}
                          style={{ width: '100%' }}
                        >
                          <FormControl px="6" pt="2" pb="0.5">
                            <FormLabel>
                              Invite someone to edit this app
                            </FormLabel>
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
                              color="fg.500"
                              fontSize="sm"
                              pt="4"
                              fontWeight="medium"
                            >
                              Existing editors
                            </Text>
                            <Box p="2" pb="0">
                              <>
                                {resourceOwnerNameQuery.data && (
                                  <Box fontSize="sm" pb="2">
                                    <HStack>
                                      <Avatar
                                        size="xs"
                                        name={resourceOwnerNameQuery.data}
                                      />
                                      <Text>
                                        Everyone at{' '}
                                        {resourceOwnerNameQuery.data}
                                      </Text>
                                    </HStack>
                                  </Box>
                                )}
                                {editorQuery.data &&
                                  editorQuery.data.appEditors?.map(
                                    (editor, i) => (
                                      <Box
                                        fontSize="sm"
                                        key={editor.user?.id || i}
                                        pb="2"
                                      >
                                        <HStack>
                                          <Avatar
                                            size="xs"
                                            src={
                                              editor.user?.image || undefined
                                            }
                                            name={
                                              editor.user?.name ||
                                              editor.user?.email
                                            }
                                          />
                                          <Tooltip label={editor.user?.email}>
                                            <Text>
                                              {editor.user?.name ||
                                                editor.user?.email}
                                            </Text>
                                          </Tooltip>
                                        </HStack>
                                      </Box>
                                    ),
                                  )}
                              </>
                            </Box>

                            {editorQuery.data &&
                              editorQuery.data.pending &&
                              editorQuery.data.pending.length > 0 && (
                                <VStack align="stretch" w="full">
                                  <Text
                                    color="fg.500"
                                    fontSize="sm"
                                    pt="4"
                                    fontWeight="medium"
                                  >
                                    Pending invitations
                                  </Text>
                                  <Box p="2" pb="0" w="full">
                                    {editorQuery.data.pending.map(
                                      ({ email }) => (
                                        <HStack w="full" pb="2">
                                          <Text fontSize="sm" key={email}>
                                            {email}
                                          </Text>
                                          <Spacer flexGrow={1} />
                                          <Button
                                            variant="link"
                                            fontSize="sm"
                                            p="0"
                                            onClick={() => {
                                              removeEditor.mutateAsync({
                                                appId,
                                                email,
                                              });
                                            }}
                                          >
                                            Revoke
                                          </Button>
                                        </HStack>
                                      ),
                                    )}
                                  </Box>
                                </VStack>
                              )}
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
                            <Text fontSize={'sm'} color="fg.600">
                              When unchecked, the code is only visible to
                              organization members and people invited to edit
                            </Text>
                          ) : (
                            <Text fontSize={'sm'} color="fg.600">
                              When checked, the code is visible to anyone on the
                              internet with the link.
                            </Text>
                          )}
                        </VStack>
                      </VStack>
                    </Box>
                  </>
                </VStack>
              ) : (
                <VStack align="start" px="5" gap="4">
                  <FormControl>
                    <FormLabel>Playground URL</FormLabel>
                    <InputGroup size="md">
                      <Input pr="4.5rem" readOnly value={playgroundUrl} />
                      <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={onCopy}>
                          {hasCopied ? 'Copied!' : 'Copy'}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Applet URL</FormLabel>
                    <InputGroup size="md">
                      <Input pr="4.5rem" readOnly value={appletUrl} />
                      <InputRightElement width="4.5rem">
                        <Button h="1.75rem" size="sm" onClick={onCopyApplet}>
                          {hasCopiedApplet ? 'Copied!' : 'Copy'}
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </FormControl>
                </VStack>
              )}
            </ModalBody>

            <ModalFooter mt={4}>
              {appQuery.data?.canUserEdit && (
                <>
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
                </>
              )}
            </ModalFooter>
          </ModalContent>
        </FormProvider>
      </Modal>
    </>
  );
};

export default ShareTab;
