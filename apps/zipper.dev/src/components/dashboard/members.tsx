import { MembershipRole } from '@clerk/types';
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
} from '@chakra-ui/react';
import { useOrganization } from '@clerk/nextjs';
import { useEffect, useRef, useState } from 'react';
import { HiTrash, HiUserAdd } from 'react-icons/hi';
import { trpc } from '~/utils/trpc';
import { HiEnvelope } from 'react-icons/hi2';
import { Avatar } from '../avatar';

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
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const { membershipList, membership, invitationList } = useOrganization({
    invitationList: {},
    membershipList: {},
  });
  const [memberToDestroy, setMemberToDestroy] = useState<
    UserListItem | undefined
  >();
  const [userList, setUserList] = useState<UserListItem[]>([]);

  type UserListItem = {
    id?: string;
    role: string;
    firstName?: string | null;
    lastName?: string | null;
    identifier: string;
    username?: string | null;
    createdAt?: Date;
    isInvite: boolean;
  };

  const [peopleSearchTerm, setPeopleSearchTerm] = useState('');

  useEffect(() => {
    let members: UserListItem[] = [];
    let invites: UserListItem[] = [];
    if (membershipList) {
      members = membershipList?.map((m) => {
        return {
          firstName: m.publicUserData.firstName,
          lastName: m.publicUserData.lastName,
          username: m.publicMetadata.username as string | undefined,
          identifier: m.publicUserData.identifier,
          isInvite: false,
          id: m.publicUserData.userId,
          createdAt: m.createdAt,
          role: m.role,
        };
      });
    }

    if (invitationList) {
      invites = invitationList.map((i) => {
        return {
          identifier: i.emailAddress,
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
            m.firstName?.includes(peopleSearchTerm) ||
            m.lastName?.includes(peopleSearchTerm) ||
            m.identifier.includes(peopleSearchTerm),
        ),
    );
  }, [membershipList, invitationList, peopleSearchTerm]);

  if (!userList) {
    return null;
  }

  const [showInviteForm, setShowInviteForm] = useState(false);

  const isCurrentUserAdmin = membership?.role === 'admin';

  return (
    <>
      {showInviteForm ? (
        <InviteMember setShowInviteForm={setShowInviteForm} />
      ) : (
        <VStack align="stretch">
          <HStack pb="4">
            <Input
              placeholder="Search people"
              value={peopleSearchTerm}
              onChange={(e) => setPeopleSearchTerm(e.target.value)}
            />
            {membership?.role === 'admin' && (
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
                              <Icon as={HiEnvelope} fill="gray.500" />
                            )}
                            <Text>{m.identifier}</Text>
                            {m.id === membership?.id && (
                              <Badge
                                variant="subtle"
                                colorScheme="purple"
                                fontSize={'2xs'}
                              >
                                you
                              </Badge>
                            )}
                          </HStack>
                          {(m.firstName || m.lastName) && (
                            <Text color="gray.500" fontSize="sm">
                              {m.firstName || m.lastName
                                ? `${m.firstName} ${m.lastName}`
                                : `${m.username || m.identifier}`}
                            </Text>
                          )}
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
                          m.id === membership?.id ||
                          m.isInvite
                        }
                        onChange={async (e) => {
                          const member = membershipList?.find((member) => {
                            return m.id === member.publicUserData.userId;
                          });
                          if (member) {
                            await member.update({
                              role: e.target.value as MembershipRole,
                            });
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
                      {isCurrentUserAdmin && m.id !== membership.id && (
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
                            invitationList
                              ?.find(
                                (i) =>
                                  i.emailAddress === memberToDestroy.identifier,
                              )
                              ?.revoke();
                          } else {
                            membershipList
                              ?.find((m) => m.id === memberToDestroy.id)
                              ?.destroy();
                            delete userList[
                              userList.findIndex(
                                (u) => u.id === memberToDestroy.id,
                              )
                            ];
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
}: {
  setShowInviteForm: (state: boolean) => void;
}) {
  const { organization } = useOrganization();
  const [emailAddress, setEmailAddress] = useState('');
  const [role, setRole] = useState<'admin' | 'basic_member'>('basic_member');
  const [disabled, setDisabled] = useState(false);
  const inviteMember = trpc.useMutation('user.sendOrganizationInvitation');

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setDisabled(true);

    // await organization?.inviteMember({ emailAddress, role });
    if (organization) {
      await inviteMember.mutateAsync({
        email: emailAddress,
        role,
        organizationId: organization.id,
      });
    }
    setShowInviteForm(false);
    setEmailAddress('');
    setRole('basic_member');
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
                setRole(e.target.value === 'admin' ? 'admin' : 'basic_member');
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
