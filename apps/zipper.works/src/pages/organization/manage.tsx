// pages/organizations/[id].ts
import { useOrganization, useUser } from '@clerk/nextjs';
import DefaultGrid from '~/components/default-grid';
import {
  GridItem,
  HStack,
  VStack,
  Icon,
  Text,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Heading,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Td,
  Button,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Input,
  Select,
  FormControl,
  FormLabel,
  Spacer,
  Badge,
  IconButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
  FormHelperText,
  Container,
} from '@chakra-ui/react';
import { HiTrash, HiUserGroup } from 'react-icons/hi2';
import { HiCog, HiUserAdd } from 'react-icons/hi';
import { useRef, useState } from 'react';
import { OrganizationMembershipRole } from '@clerk/clerk-sdk-node';
import { MembershipRole } from '@clerk/types';
import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';

// View and manage active organization members, along with any
// pending invitations.
// Invite new members.
export default function Organization() {
  const [currentPage, setCurrentPage] = useState<'members' | 'settings'>(
    'members',
  );
  const { organization, isLoaded } = useOrganization();
  const router = useRouter();

  if (isLoaded && !organization) {
    router.push('/');
  }

  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <Tabs colorScheme="purple">
      <DefaultGrid w="full" px="none" overflow="hidden">
        <GridItem colSpan={2} p={4} color="gray.500" fontSize="sm">
          <VStack alignItems="start" gap={1}>
            <HStack
              w="full"
              p="1"
              cursor="pointer"
              onClick={() => {
                setCurrentPage('members');
              }}
            >
              <Icon as={HiUserGroup} />
              <Text
                size="sm"
                fontWeight={currentPage === 'members' ? 'semibold' : 'normal'}
                color={currentPage === 'members' ? 'black' : 'gray.600'}
                flexGrow={1}
              >
                Members
              </Text>
            </HStack>

            <HStack
              w="full"
              p="1"
              cursor="pointer"
              onClick={() => {
                setCurrentPage('settings');
              }}
            >
              <Icon as={HiCog} />
              <Text
                fontWeight={currentPage === 'settings' ? 'semibold' : 'normal'}
                size="sm"
                color={currentPage === 'settings' ? 'black' : 'gray.600'}
                flexGrow={1}
              >
                Settings
              </Text>
            </HStack>
          </VStack>
        </GridItem>
        <GridItem colSpan={9}>
          {currentPage === 'members' && (
            <>
              {showInviteForm ? (
                <InviteMember setShowInviteForm={setShowInviteForm} />
              ) : (
                <>
                  <HStack>
                    <Box flexGrow={1}>
                      <Heading as={'h1'} fontWeight="md" mb="2">
                        Members
                      </Heading>
                      <Heading
                        as={'h3'}
                        fontSize="lg"
                        fontWeight="normal"
                        mb={6}
                      >
                        View and manage organization members
                      </Heading>
                    </Box>
                    <Button
                      colorScheme="purple"
                      onClick={() => setShowInviteForm(true)}
                    >
                      <Icon as={HiUserAdd} mr={2} /> Invite
                    </Button>
                  </HStack>
                  <TabList>
                    <Tab>Active</Tab>
                    <Tab>Invited</Tab>
                  </TabList>
                  <TabPanels>
                    <TabPanel p={0} mt={4}>
                      <MemberList />
                    </TabPanel>
                    <TabPanel p={0} mt={4}>
                      <InvitationList />
                    </TabPanel>
                  </TabPanels>
                </>
              )}
            </>
          )}
          {currentPage === 'settings' && <Settings />}
        </GridItem>
      </DefaultGrid>
    </Tabs>
  );
}

function Settings() {
  const [disabled, setDisabled] = useState(false);
  const { organization } = useOrganization();
  const [orgName, setOrgName] = useState(organization?.name || '');
  const organizationSlugQuery = trpc.useQuery(
    [
      'organizationSlug.findByOrganizationId',
      { organizationId: organization?.id || '' },
    ],
    { enabled: !!organization },
  );

  const handleOrgNameSubmit = async (e: any) => {
    e.preventDefault();
    setDisabled(true);
    await organization?.update({ name: orgName });
    setDisabled(false);
  };

  return (
    <>
      <Heading as={'h1'} fontWeight="md" mb="2">
        Settings
      </Heading>
      <Heading as={'h3'} fontSize="lg" fontWeight="normal" mb={6}>
        View and manage organization settings
      </Heading>
      <Box w="lg">
        <form onSubmit={handleOrgNameSubmit}>
          <FormControl>
            <FormLabel>Organization Name</FormLabel>
            <Input
              defaultValue={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            ></Input>
            <FormHelperText>
              {`This is the display name for your organization. It does not change
            the url: ${process.env.NEXT_PUBLIC_HOST}/${organizationSlugQuery.data?.slug}`}
            </FormHelperText>
          </FormControl>
          <HStack justifyContent={'end'} w="full">
            <Button type="submit" colorScheme="purple" isDisabled={disabled}>
              Save
            </Button>
          </HStack>
        </form>
      </Box>
    </>
  );
}

// List of organization memberships. Administrators can
// change member roles or remove members from the organization.
function MemberList() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const { membershipList, membership } = useOrganization({
    membershipList: {},
  });
  const [memberToDestroy, setMemberToDestroy] = useState<any | undefined>();

  if (!membershipList) {
    return null;
  }

  const isCurrentUserAdmin = membership?.role === 'admin';

  return (
    <TableContainer>
      <Table fontSize="sm">
        <Thead color="gray.500">
          <Tr>
            <Td>User</Td>
            <Td>Joined</Td>
            <Td>Role</Td>
            <Td></Td>
          </Tr>
        </Thead>
        <Tbody>
          {membershipList.map((m) => (
            <Tr key={m.id}>
              <Td>
                <VStack alignItems="start" spacing={0}>
                  <HStack>
                    <Text>
                      {m.publicUserData.firstName} {m.publicUserData.lastName}
                    </Text>
                    {m.id === membership?.id && (
                      <Badge variant="subtle" colorScheme="purple">
                        you
                      </Badge>
                    )}
                  </HStack>
                  <Text color="gray.500">{m.publicUserData.identifier}</Text>
                </VStack>
              </Td>
              <Td>{m.createdAt.toLocaleDateString()}</Td>
              <Td>
                <Select
                  fontSize="sm"
                  isDisabled={isCurrentUserAdmin && m.id === membership?.id}
                  onChange={async (e) => {
                    await m.update({
                      role: e.target.value as MembershipRole,
                    });
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
              <Td alignItems={'end'}>
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
              Delete Customer
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
                    await memberToDestroy.destroy();
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
  );
}

function AdminControls({ membership }: { membership: any }) {
  const [disabled, setDisabled] = useState(false);
  const { user } = useUser();

  if (membership?.publicUserData?.userId === user?.id) {
    return null;
  }

  const remove = async () => {
    setDisabled(true);
    await membership.destroy();
  };

  const changeRole = async (role: OrganizationMembershipRole) => {
    setDisabled(true);
    await membership.update({ role });
    setDisabled(false);
  };

  return (
    <>
      <Button
        isDisabled={disabled}
        onClick={remove}
        fontSize="sm"
        fontWeight="normal"
      >
        Remove member
      </Button>{' '}
      {membership.role === 'admin' ? (
        <Button
          isDisabled={disabled}
          fontSize="sm"
          fontWeight="normal"
          onClick={() => changeRole('basic_member')}
        >
          Change to member
        </Button>
      ) : (
        <Button
          isDisabled={disabled}
          fontSize="sm"
          fontWeight="normal"
          onClick={() => changeRole('admin')}
        >
          Change to admin
        </Button>
      )}
    </>
  );
}

// List of organization pending invitations.
// You can invite new organization members and
// revoke already sent invitations.
function InvitationList() {
  const { invitationList, membership } = useOrganization({
    invitationList: {},
  });

  const isCurrentUserAdmin = membership?.role === 'admin';

  const revoke = async (inv: any) => {
    await inv.revoke();
  };

  if (invitationList?.length === 0) {
    return (
      <Text p={2} color="gray.600">
        There are no pending invitations.
      </Text>
    );
  }

  return (
    <TableContainer>
      <Table fontSize="sm">
        <Thead color="gray.500">
          <Tr>
            <Td>Email</Td>
            <Td>Role</Td>
            <Td></Td>
          </Tr>
        </Thead>
        <Tbody>
          {invitationList && invitationList.length > 0 && (
            <>
              {invitationList.map((i) => (
                <Tr key={i.id}>
                  <Td>{i.emailAddress}</Td>
                  <Td>{i.role}</Td>
                  <Td>
                    {isCurrentUserAdmin && (
                      <IconButton
                        aria-label="remove user"
                        variant="outline"
                        colorScheme="red"
                        onClick={() => {
                          revoke(i);
                        }}
                      >
                        <Icon as={HiTrash} />
                      </IconButton>
                    )}
                  </Td>
                </Tr>
              ))}
            </>
          )}
        </Tbody>
      </Table>
    </TableContainer>
  );
}

function InviteMember({
  setShowInviteForm,
}: {
  setShowInviteForm: (state: boolean) => void;
}) {
  const { organization } = useOrganization();
  const [emailAddress, setEmailAddress] = useState('');
  const [role, setRole] = useState<'basic_member' | 'admin'>('basic_member');
  const [disabled, setDisabled] = useState(false);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setDisabled(true);
    await organization?.inviteMember({ emailAddress, role });
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
            Members
          </BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem isCurrentPage>
          <Text>Invite Member</Text>
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
          <FormControl w="50">
            <FormLabel fontSize="sm">Role</FormLabel>
            <Select>
              <option defaultChecked onSelect={() => setRole('admin')}>
                Admin
              </option>
              <option onSelect={() => setRole('basic_member')}>Member</option>
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
