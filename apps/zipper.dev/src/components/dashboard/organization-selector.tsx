import { CheckIcon } from '@chakra-ui/icons';
import {
  Menu,
  MenuButton,
  Button,
  MenuList,
  MenuItem,
  HStack,
  Icon,
  Text,
} from '@chakra-ui/react';
import { useOrganizationList } from '@clerk/nextjs';
import { useState } from 'react';
import { HiSwitchHorizontal } from 'react-icons/hi';
import { HiOutlineChevronUpDown } from 'react-icons/hi2';

export const OrganizationSelector: React.FC<{
  selectedOrganizationId?: string | null;
  fontSize?: 'sm' | 'md' | 'lg';
  setSelectedOrganizationId: (id: string | null) => void;
}> = ({
  selectedOrganizationId = null,
  setSelectedOrganizationId,
  fontSize = 'sm',
}) => {
  const { organizationList } = useOrganizationList();

  const allWorkspaces = [
    { organization: { id: null, name: 'Personal Workspace' } },
    ...(organizationList || []),
  ];

  const [hoverOrg, setHoverOrg] = useState<string | undefined | null>(
    undefined,
  );

  const organization = allWorkspaces.find(
    (org) => org.organization.id === selectedOrganizationId,
  );

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<HiOutlineChevronUpDown />}
        backgroundColor="transparent"
        border="1px"
        borderColor="gray.100"
        maxW={'33%'}
        minW="max-content"
      >
        <Text fontSize={fontSize} fontWeight="medium" overflow="hidden">
          {organization?.organization.name || 'Personal Workspace'}
        </Text>
      </MenuButton>
      <MenuList p={0} fontSize={fontSize} shadow={'lg'}>
        {allWorkspaces.map((org) => {
          return (
            <MenuItem
              key={org.organization.id}
              onMouseEnter={() => setHoverOrg(org.organization.id)}
              onMouseLeave={() => setHoverOrg(undefined)}
              onClick={() => {
                setSelectedOrganizationId(org.organization.id);
              }}
              backgroundColor="gray.50"
              px="4"
              pt="2"
              _hover={{ backgroundColor: 'gray.200' }}
            >
              <HStack w="full">
                <Text w="full" fontWeight="medium" flexGrow={1}>
                  {org.organization.name}
                </Text>
                {selectedOrganizationId === org.organization.id ? (
                  <CheckIcon />
                ) : (
                  <Icon
                    as={HiSwitchHorizontal}
                    color={'gray.500'}
                    visibility={
                      hoverOrg === org.organization.id ? 'visible' : 'hidden'
                    }
                  ></Icon>
                )}
              </HStack>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
};
