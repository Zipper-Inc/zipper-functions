import {
  HStack,
  Heading,
  Button,
  Icon,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  FormControl,
  FormLabel,
  Input,
  Select,
  Spacer,
  Text,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Badge,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Thead,
  Tr,
  useDisclosure,
  VStack,
  Flex,
  Box,
  useToast,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { HiTrash, HiUserAdd } from 'react-icons/hi';
import { trpc } from '~/utils/trpc';
import { HiEnvelope } from 'react-icons/hi2';
import { Avatar } from '../avatar';
import { useOrganization } from '~/hooks/use-organization';
import { UserRole } from '@zipper/types';
import { useUser } from '~/hooks/use-user';
import { OrganizationInvitation } from '@prisma/client';

type UserListItem = {
  id?: string;
  role: string;
  name?: string | null;
  email: string;
  username?: string | null;
  createdAt?: Date;
  isInvite: boolean;
};

const ManageMembers = () => {
  return (
    <Flex
      flexDir={{ base: 'column', xl: 'row' }}
      flex={1}
      alignItems="start"
      gap={{ base: 10, xl: 16 }}
    >
      <VStack flex={1} alignItems="stretch">
        <HStack pb="4">
          <Heading as="h6" fontWeight={400}>
            People
          </Heading>
        </HStack>
        <Text mb="4">Manage people in this organization</Text>
      </VStack>
      <VStack align="stretch" flex={3} pb="10">
        <MemberList />
      </VStack>
    </Flex>
  );
};

function MemberList() {
  const context = trpc.useContext();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const { membershipList, role, invitationList, invite } = useOrganization({
    invitationList: {},
    membershipList: {},
  });
  const { user } = useUser();
  const [memberToDestroy, setMemberToDestroy] = useState<
    UserListItem | undefined
  >();
  const [userList, setUserList] = useState<UserListItem[]>([]);

  const updateMemberMutation = trpc.useMutation('organization.updateMember', {
    onSuccess: () => {
      context.invalidateQueries(['organization.getMemberships']);
    },
  });

  const [peopleSearchTerm, setPeopleSearchTerm] = useState('');

  useEffect(() => {
    let members: UserListItem[] = [];
    let invites: UserListItem[] = [];
    if (membershipList) {
      members = membershipList?.map((m) => {
        return {
          name: m.user.name,
          username: m.user.slug,
          email: m.user.email,
          isInvite: false,
          id: m.user.id,
          createdAt: m.createdAt,
          role: m.role,
        };
      });
    }

    if (invitationList) {
      invites = invitationList.map((i) => {
        return {
          email: i.email,
          role: i.role,
          isInvite: true,
        };
      });
    }

    setUserList(
      members
        .concat(invites)
        .filter(
          (m) =>
            m.name?.includes(peopleSearchTerm) ||
            m.username?.includes(peopleSearchTerm) ||
            m.email.includes(peopleSearchTerm),
        ),
    );
  }, [membershipList, invitationList, peopleSearchTerm]);

  if (!userList) {
    return null;
  }

  const [showInviteForm, setShowInviteForm] = useState(false);

  const isCurrentUserAdmin = role === UserRole.Admin;

  const toast = useToast();

  return (
    <>
      {showInviteForm ? (
        <InviteMember
          setShowInviteForm={setShowInviteForm}
          inviteMember={invite}
        />
      ) : (
        <VStack align="stretch">
          <HStack pb="4">
            <Input
              placeholder="Search people"
              value={peopleSearchTerm}
              onChange={(e) => setPeopleSearchTerm(e.target.value)}
            />
            {role === UserRole.Admin && (
              <Button
                type="button"
                pl={4}
                pr={6}
                variant="solid"
                colorScheme="purple"
                textColor="gray.100"
                fontSize="sm"
                onClick={() => setShowInviteForm(true)}
              >
                <Icon mr="2" as={HiUserAdd} /> Invite
              </Button>
            )}
          </HStack>
          <TableContainer>
            <Table>
              <Thead
                fontWeight="bold"
                py="3"
                fontSize="xs"
                textTransform="uppercase"
                color="gray.600"
              >
                <Tr>
                  <Td pl="2">User</Td>
                  <Td>Joined</Td>
                  <Td>Role</Td>
                  <Td textAlign="end" w="1"></Td>
                </Tr>
              </Thead>
              <Tbody>
                {userList.map((m, i) => (
                  <Tr key={m.id || i}>
                    <Td pl="2">
                      <HStack spacing={4}>
                        <Avatar userId={m.id} />
                        <VStack alignItems="start" spacing={1}>
                          <HStack>
                            {m.isInvite && (
                              <>
                                <Icon as={HiEnvelope} fill="gray.500" />
                                <Text>{m.email}</Text>
                              </>
                            )}
                            <Text>{m.name || m.username}</Text>
                            {m.username === user?.username && (
                              <Badge
                                variant="subtle"
                                colorScheme="purple"
                                fontSize={'2xs'}
                              >
                                you
                              </Badge>
                            )}
                          </HStack>
                          <Text color="gray.500" fontSize="sm">
                            {m.email}
                          </Text>
                        </VStack>
                      </HStack>
                    </Td>
                    <Td>
                      {m.createdAt
                        ? m.createdAt.toLocaleDateString()
                        : 'Invited'}
                    </Td>
                    <Td>
                      <Select
                        fontSize="sm"
                        isDisabled={
                          !isCurrentUserAdmin ||
                          m.username === user?.username ||
                          m.isInvite
                        }
                        onChange={async (e) => {
                          const member = membershipList?.find((member) => {
                            return m.id === member.user.id;
                          });
                          if (member) {
                            await updateMemberMutation.mutateAsync(
                              {
                                userId: member.userId,
                                data: {
                                  role: e.target.value as UserRole,
                                },
                              },
                              {
                                onSuccess: () => {
                                  toast({
                                    title: 'Member updated',
                                    description: `${member.user.name}'s role has been updated`,
                                    status: 'success',
                                    duration: 5000,
                                  });
                                },
                                onError: (e) => {
                                  toast({
                                    title: 'Error',
                                    description: e.message,
                                    status: 'error',
                                    duration: 5000,
                                  });
                                },
                              },
                            );
                          }
                        }}
                      >
                        <option
                          value="basic_member"
                          selected={m.role === 'basic_member'}
                        >
                          Member
                        </option>
                        <option value="admin" selected={m.role === 'admin'}>
                          Admin
                        </option>
                      </Select>
                    </Td>
                    <Td textAlign={'end'}>
                      {isCurrentUserAdmin && m.username !== user?.username && (
                        <IconButton
                          aria-label="remove user"
                          variant="outline"
                          colorScheme="red"
                          onClick={() => {
                            setMemberToDestroy(m);
                            onOpen();
                          }}
                        >
                          <Icon as={HiTrash} />
                        </IconButton>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>

            {userList.length === 0 && peopleSearchTerm.length > 0 && (
              <Button
                m="2"
                variant={'unstyled'}
                onClick={async () => {
                  await invite(peopleSearchTerm, UserRole.Member);
                  setPeopleSearchTerm('');
                }}
              >
                <HStack>
                  <Icon as={HiUserAdd} />
                  <Text fontWeight={'normal'}>
                    Invite{' '}
                    <Text
                      as="span"
                      fontWeight="semibold"
                    >{`${peopleSearchTerm}`}</Text>
                  </Text>
                </HStack>
              </Button>
            )}
            <AlertDialog
              isOpen={isOpen}
              leastDestructiveRef={cancelRef}
              onClose={onClose}
            >
              <AlertDialogOverlay>
                <AlertDialogContent>
                  <AlertDialogHeader fontSize="lg" fontWeight="bold">
                    Remove user
                  </AlertDialogHeader>

                  <AlertDialogBody>
                    Are you sure? You can't undo this action afterwards.
                  </AlertDialogBody>

                  <AlertDialogFooter>
                    <Button ref={cancelRef} onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      colorScheme="red"
                      onClick={async () => {
                        if (memberToDestroy) {
                          if (memberToDestroy.isInvite) {
                            await invitationList
                              ?.find((i) => i.email === memberToDestroy.email)
                              ?.revoke();
                          } else {
                            await membershipList
                              ?.find((m) => m.userId === memberToDestroy.id)
                              ?.destroy();
                          }

                          setMemberToDestroy(undefined);
                        }
                        onClose();
                      }}
                      ml={3}
                    >
                      Delete
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
          </TableContainer>
        </VStack>
      )}
    </>
  );
}

function InviteMember({
  setShowInviteForm,
  inviteMember,
}: {
  setShowInviteForm: (state: boolean) => void;
  inviteMember: (
    email: string,
    role: UserRole,
  ) => Promise<OrganizationInvitation>;
}) {
  const [emailAddress, setEmailAddress] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.Member);
  const [disabled, setDisabled] = useState(false);

  const toast = useToast();

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setDisabled(true);

    await inviteMember(emailAddress, role);

    setShowInviteForm(false);
    setEmailAddress('');
    setRole(UserRole.Member);
    setDisabled(false);
  };

  return (
    <>
      <Breadcrumb fontSize="sm">
        <BreadcrumbItem>
          <BreadcrumbLink href="#" onClick={() => setShowInviteForm(false)}>
            People
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem isCurrentPage>
          <Text>Invite</Text>
        </BreadcrumbItem>
      </Breadcrumb>

      <Heading as={'h1'} fontWeight="md" mb="2" mt="4" fontSize="3xl">
        Invite Member
      </Heading>
      <Heading as={'h3'} fontSize="md" fontWeight="normal" mb={6}>
        Invite new members to this organization
      </Heading>
      <form onSubmit={onSubmit}>
        <HStack mb="6">
          <FormControl w="full" flexGrow={1}>
            <FormLabel fontSize="sm">Email address</FormLabel>
            <Input
              w="full"
              type="email"
              placeholder="Email address"
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
            />
          </FormControl>
          <FormControl w="xs">
            <FormLabel fontSize="sm">Role</FormLabel>
            <Select
              onChange={(e) => {
                setRole(
                  e.target.value === 'admin' ? UserRole.Admin : UserRole.Member,
                );
              }}
            >
              <option value="basic_member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          </FormControl>
        </HStack>
        <HStack w="full">
          <Spacer flexGrow={1} />
          <Button
            onClick={() => {
              setShowInviteForm(false);
            }}
          >
            Cancel
          </Button>
          <Button type="submit" isDisabled={disabled} colorScheme="purple">
            Send Invitation
          </Button>
        </HStack>
      </form>
    </>
  );
}

export default ManageMembers;
