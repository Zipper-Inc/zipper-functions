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
  Tr,
  Button,
  Spacer,
  Icon,
  useDisclosure,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';

import { useOrganizationList } from '~/hooks/use-organization-list';
import { useEffect, useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { CreateOrganizationModal } from '../auth/createOrganizationModal';
import UserProfile from '../auth/userProfile';
import SlackInstallButton from './slack-install-button';

function UserSettings() {
  const [hash, setHash] = useState<string | undefined>();

  const { organizationList, setActive, isLoaded } = useOrganizationList();
  const {
    isOpen: isOpenCreateOrg,
    onOpen: onOpenCreateOrg,
    onClose: onCloseCreateOrg,
  } = useDisclosure();

  useEffect(() => {
    const onHashChanged = () => {
      setHash(window.location.hash);
    };

    window.addEventListener('hashchange', onHashChanged);

    return () => {
      window.removeEventListener('hashchange', onHashChanged);
    };
  }, []);

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
        <Box w="100%" mb={8}>
          <Text fontSize={'xl'}>General</Text>
          <Divider mb="4" mt={2} />
          <UserProfile />
        </Box>

        <Box w="100%" pb="10">
          <Text fontSize={'xl'}>Integrations</Text>
          <Divider mb="4" mt={2} />
          <FormControl>
            <FormLabel size="sm">Run Applets from Slack</FormLabel>
            <Text fontSize="sm" color="fg.600" mb="4">
              Once installed, run the `/zipper [applet-slug]` slash command to
              run an applet from within Slack
            </Text>
            <SlackInstallButton />
          </FormControl>
        </Box>

        {!hash && (
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
                fontSize="sm"
                onClick={onOpenCreateOrg}
              >
                <Icon mr="2" as={HiPlus} />
                Create Organization
              </Button>
            </HStack>
            <Divider mb="4" mt={2} />
            {isLoaded && (
              <TableContainer border="1px" borderColor="fg.200">
                <Table fontSize="sm">
                  <Tbody>
                    {organizationList.length > 0 ? (
                      organizationList?.map(({ organization, role }, i) => (
                        <Tr key={organization.id || i}>
                          <Td>
                            <VStack align="start">
                              <Text fontWeight="semibold">
                                {organization.name}
                              </Text>
                              <Text>{role}</Text>
                            </VStack>
                          </Td>
                          <Td textAlign="end">
                            <Button
                              onClick={() =>
                                setActive && setActive(organization.id)
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
        )}
      </VStack>
      <CreateOrganizationModal
        isOpen={isOpenCreateOrg}
        onClose={onCloseCreateOrg}
      />
    </HStack>
  );
}

export default UserSettings;
