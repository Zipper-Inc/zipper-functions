import {
  HStack,
  Heading,
  VStack,
  Text,
  Box,
  Divider,
  Table,
  TableContainer,
  Tbody,
  Td,
  Thead,
  Tr,
  Button,
  Spacer,
  Icon,
  useDisclosure,
} from '@chakra-ui/react';
import { useOrganizationList, UserProfile } from '@clerk/nextjs';
import { HiPlus } from 'react-icons/hi';
import { CreateOrganizationModal } from '../auth/createOrganizationModal';

function UserSettings() {
  const { organizationList, setActive, isLoaded } = useOrganizationList();
  const {
    isOpen: isOpenCreateOrg,
    onOpen: onOpenCreateOrg,
    onClose: onCloseCreateOrg,
  } = useDisclosure();

  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack flex={1} alignItems="stretch">
        <HStack pb="4">
          <Heading as="h6" fontWeight={400}>
            Settings
          </Heading>
        </HStack>
        <Text mb="4">Manage your personal settings</Text>
      </VStack>
      <VStack align="stretch" flex={3} pb="10">
        <Box w="100%">
          <Text fontSize={'xl'}>General</Text>
          <Divider mb="4" mt={2} />
          <UserProfile
            appearance={{
              elements: {
                rootBox: {
                  width: '100%',
                  fontFamily: 'InterVariable',
                  color: 'var(--chakra-colors-chakra-body-text)',
                },
                card: {
                  boxShadow: 'none',
                  width: '100%',
                },
                navbar: {
                  display: 'none',
                },
                scrollBox: {
                  width: '100%',
                },
                pageScrollBox: {
                  paddingTop: '0px',
                },
                header: { display: 'none' },
                profileSectionTitle: {
                  borderBottom: '0px',
                },
                profileSectionTitleText: {
                  color: 'var(--chakra-colors-gray-700)',
                  fontWeight: '500',
                },
              },
            }}
          />
        </Box>

        <Box w="100%">
          <HStack>
            <Text fontSize={'xl'}>Organizations</Text>
            <Spacer flexGrow={1} />
            <Button
              type="button"
              pl={4}
              pr={6}
              variant="solid"
              colorScheme="purple"
              textColor="gray.100"
              fontSize="sm"
              onClick={onOpenCreateOrg}
            >
              <Icon mr="2" as={HiPlus} />
              Create Organization
            </Button>
          </HStack>
          <Divider mb="4" mt={2} />
          {isLoaded && (
            <TableContainer border="1px" borderColor="gray.200">
              <Table fontSize="sm">
                <Tbody>
                  {organizationList.length > 0 ? (
                    organizationList?.map(({ organization, membership }, i) => (
                      <Tr key={organization.id || i}>
                        <Td>
                          <VStack align="start">
                            <Text fontWeight="semibold">
                              {organization.name}
                            </Text>
                            <Text>{membership.role}</Text>
                          </VStack>
                        </Td>
                        <Td textAlign="end">
                          <Button
                            onClick={() =>
                              setActive({ organization: organization.id })
                            }
                            variant="outline"
                            size="sm"
                            colorScheme="purple"
                          >
                            Switch
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  ) : (
                    <Tr>
                      <Td colSpan={3}>
                        You're not a member of any organizations
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </VStack>
      <CreateOrganizationModal
        isOpen={isOpenCreateOrg}
        onClose={onCloseCreateOrg}
      />
    </HStack>
  );
}

export default UserSettings;
