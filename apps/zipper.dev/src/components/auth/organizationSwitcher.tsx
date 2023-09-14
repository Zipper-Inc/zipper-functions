import {
  Box,
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
  Icon,
  VStack,
  useDisclosure,
  ButtonProps,
  Badge,
} from '@chakra-ui/react';
import { HiOutlineChevronUpDown, HiPlus } from 'react-icons/hi2';
import { HiEye, HiSwitchHorizontal } from 'react-icons/hi';
import { useState } from 'react';
import { CreateOrganizationModal } from './createOrganizationModal';
import { useRouter } from 'next/router';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { useUser } from '~/hooks/use-user';
import { useOrganization } from '~/hooks/use-organization';
import { trpc } from '~/utils/trpc';
import { useSession } from 'next-auth/react';

export const OrganizationSwitcher: React.FC<ButtonProps> = (props) => {
  // get the authed user's organizations from Clerk
  const { setActive, organizationList, isLoaded, currentOrganizationId } =
    useOrganizationList();
  const { organization, role } = useOrganization();

  const session = useSession();

  const acceptInvitation = trpc.useMutation('organization.acceptInvitation');

  const { user } = useUser();

  const [hoverOrg, setHoverOrg] = useState<string | undefined | null>(
    undefined,
  );

  const allWorkspaces = [
    {
      organization: {
        id: null,
        name: 'Personal Workspace',
        slug: user?.username,
      },
      pending: false,
    },
    ...(organizationList || []),
  ];

  const workspacesExcludingCurrent = allWorkspaces.filter((o) => {
    return o.organization.id !== (currentOrganizationId || null);
  });

  const {
    isOpen: isOpenCreateOrg,
    onOpen: onOpenCreateOrg,
    onClose: onCloseCreateOrg,
  } = useDisclosure();

  const router = useRouter();

  if (!isLoaded) return <></>;

  return (
    <Box>
      <Menu>
        <MenuButton
          as={Button}
          backgroundColor="transparent"
          border="1px"
          borderColor="fg.100"
          fontSize="sm"
          fontWeight="medium"
          {...props}
        >
          <HStack>
            <Text>
              {organization?.name ||
                (user?.username as string) ||
                'Personal Workspace'}
            </Text>
            <Icon as={HiOutlineChevronUpDown} fontSize="md" />
          </HStack>
        </MenuButton>
        <MenuList p={0} fontSize="sm" minWidth="xs">
          <HStack
            borderBottom="1px"
            borderColor="fg.300"
            px={4}
            py={6}
            w="full"
            spacing={10}
          >
            <VStack flexGrow="1" alignItems="start" spacing={0}>
              <Text fontWeight="medium">
                {organization?.name || 'Personal Workspace'}
              </Text>
              {!organization && <Text>{user?.username as string}</Text>}
              {organization && (
                <Text>{role === 'admin' ? 'Admin' : 'Member'}</Text>
              )}
            </VStack>
            <Button
              onClick={() => {
                router.push(
                  `/${organization?.slug || (user?.username as string)}`,
                );
              }}
              size="xs"
            >
              <Icon as={HiEye} mr="2" />
              Profile
            </Button>
          </HStack>
          {workspacesExcludingCurrent.length > 0 && (
            <Box
              w="full"
              backgroundColor={'fg.50'}
              backdropFilter="blur(10px)"
              pl="4"
              pt="6"
              fontSize="xs"
            >
              <Text>Switch workspace:</Text>
            </Box>
          )}
          {workspacesExcludingCurrent.map((org) => {
            return (
              <MenuItem
                key={org.organization.id}
                onClick={async () => {
                  if (org.pending) {
                    router.push(`/${org.organization.slug}`);
                  } else {
                    setActive && setActive(org.organization.id);
                  }
                }}
                backgroundColor="fg.50"
                px="4"
                pt="2"
              >
                <Box w="full">
                  <HStack>
                    <Text
                      w="full"
                      fontWeight="medium"
                      flexGrow={1}
                      onMouseEnter={() => setHoverOrg(org.organization.id)}
                      onMouseLeave={() => setHoverOrg(undefined)}
                    >
                      {org.organization.name}
                    </Text>
                    {org.pending ? (
                      <Badge
                        size="xs"
                        textTransform="capitalize"
                        px="2"
                        py="1"
                        fontWeight="semibold"
                        variant="outline"
                      >
                        Invited
                      </Badge>
                    ) : (
                      <Icon
                        as={HiSwitchHorizontal}
                        color={'fg.400'}
                        visibility={
                          hoverOrg === org.organization.id
                            ? 'visible'
                            : 'hidden'
                        }
                      ></Icon>
                    )}
                  </HStack>
                </Box>
              </MenuItem>
            );
          })}
          <MenuItem
            backgroundColor="fg.50"
            color="fg.600"
            pt={4}
            pb={6}
            px={4}
            onClick={onOpenCreateOrg}
          >
            <HStack>
              <Icon as={HiPlus}></Icon>
              <Text>Create Organization</Text>
            </HStack>
          </MenuItem>
        </MenuList>
      </Menu>
      <CreateOrganizationModal
        isOpen={isOpenCreateOrg}
        onClose={onCloseCreateOrg}
      />
    </Box>
  );
};

export default OrganizationSwitcher;
