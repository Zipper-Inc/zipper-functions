import { useOrganization, useOrganizationList } from '@clerk/nextjs';
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
  IconButton,
  Avatar,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { HiOutlineChevronUpDown, HiPlus } from 'react-icons/hi2';
import { HiSwitchHorizontal, HiCog } from 'react-icons/hi';
import { useState } from 'react';

export const OrganizationSwitcher = () => {
  const { setActive, organizationList, isLoaded } = useOrganizationList();
  const { organization, membership } = useOrganization();
  const router = useRouter();

  const [hoverOrg, setHoverOrg] = useState<string | undefined | null>(
    undefined,
  );

  if (!isLoaded) return <></>;

  const allOrganizations = [
    { organization: { id: null, name: 'Personal Workspace' } },
    ...(organizationList || []),
  ];

  const otherOrganizations = allOrganizations.filter((o) => {
    return o.organization.id !== (organization?.id || null);
  });

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<HiOutlineChevronUpDown />}
        backgroundColor="transparent"
      >
        <Text fontSize="sm" fontWeight="medium">
          {organization?.name || 'Personal Workspace'}
        </Text>
      </MenuButton>
      <MenuList p={0} fontSize="sm">
        <HStack borderBottom="1px" borderColor="gray.300" p={4} w="full">
          <VStack flexGrow="1" alignItems="start" spacing={0}>
            <Text fontWeight="medium">
              {organization?.name || 'Personal Workspace'}
            </Text>
            {membership && <Text>{membership.role}</Text>}
          </VStack>
          {organization && (
            <IconButton aria-label="Manage organization" variant={'ghost'}>
              <HiCog />
            </IconButton>
          )}
        </HStack>
        {otherOrganizations.length > 0 && (
          <Box
            w="full"
            backgroundColor={'gray.100'}
            pl="4"
            pt="4"
            fontSize="xs"
          >
            <Text>Other organizations:</Text>
          </Box>
        )}
        {otherOrganizations.map((org) => {
          return (
            <MenuItem
              key={org.organization.id}
              onClick={() => {
                setActive && setActive({ organization: org.organization.id });
                router.push(`${router.pathname}?reload=true`);
              }}
              backgroundColor="gray.100"
              p="4"
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
                  <Icon
                    as={HiSwitchHorizontal}
                    color={'gray.400'}
                    visibility={
                      hoverOrg === org.organization.id ? 'visible' : 'hidden'
                    }
                  ></Icon>
                </HStack>
              </Box>
            </MenuItem>
          );
        })}
        <MenuItem
          backgroundColor="gray.100"
          color="gray.600"
          pt={2}
          pb={4}
          px={4}
        >
          <HStack>
            <Icon as={HiPlus}></Icon>
            <Text>Create Organization</Text>
          </HStack>
        </MenuItem>
      </MenuList>
    </Menu>
  );
};

export default OrganizationSwitcher;
