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
import { useState } from 'react';
import { HiSwitchHorizontal } from 'react-icons/hi';
import { HiOutlineChevronUpDown } from 'react-icons/hi2';
import { useOrganizationList } from '~/hooks/use-organization-list';

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
        borderColor="fg.100"
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
              backgroundColor="fg.50"
              px="4"
              pt="2"
              _hover={{ backgroundColor: 'fg.200' }}
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
                    color={'fg.500'}
                    visibility={
                      hoverOrg === org.organization.id ? 'visible' : 'hidden'
                    }
                  />
                )}
              </HStack>
            </MenuItem>
          );
        })}
      </MenuList>
    </Menu>
  );
};
