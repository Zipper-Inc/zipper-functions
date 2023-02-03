// pages/organizations/[id].ts
import { OrganizationProfile } from '@clerk/nextjs';
import DefaultGrid from '~/components/default-grid';
import { GridItem, HStack, VStack, Icon, Text } from '@chakra-ui/react';
import { HiUserGroup } from 'react-icons/hi2';
import { HiCog } from 'react-icons/hi';
import { useState } from 'react';

// View and manage active organization members, along with any
// pending invitations.
// Invite new members.
export default function Organization() {
  const [currentPage, setCurrentPage] = useState<'members' | 'settings'>(
    'members',
  );
  return (
    <DefaultGrid w="full" px="none" overflow="hidden">
      <GridItem colSpan={3} p={4} color="gray.500" fontSize="sm">
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
          <OrganizationProfile
            appearance={{
              elements: {
                navbar: { display: 'none' },
                card: { boxShadow: 'none' },
              },
            }}
          />
        )}
        {currentPage === 'settings' && <></>}
      </GridItem>
    </DefaultGrid>
  );
}
