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
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  Input,
  FormLabel,
  FormHelperText,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import {
  HiBuildingStorefront,
  HiOutlineChevronUpDown,
  HiPlus,
} from 'react-icons/hi2';
import { HiSwitchHorizontal, HiCog } from 'react-icons/hi';
import { FormEventHandler, useState } from 'react';
import slugify from '~/utils/slugify';

export const OrganizationSwitcher = () => {
  const { setActive, organizationList, isLoaded } = useOrganizationList();
  const { organization, membership } = useOrganization();
  const router = useRouter();
  const {
    isOpen: isOpenCreateOrg,
    onOpen: onOpenCreateOrg,
    onClose: onCloseCreateOrg,
  } = useDisclosure();

  const [hoverOrg, setHoverOrg] = useState<string | undefined | null>(
    undefined,
  );

  const { createOrganization } = useOrganizationList();
  const [organizationName, setOrganizationName] = useState('');

  if (!isLoaded) return <></>;

  const allOrganizations = [
    { organization: { id: null, name: 'Personal Workspace' } },
    ...(organizationList || []),
  ];

  const otherOrganizations = allOrganizations.filter((o) => {
    return o.organization.id !== (organization?.id || null);
  });

  const handleCreateOrgSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    if (!createOrganization) return;
    createOrganization({ name: organizationName });
    setOrganizationName('');
  };

  return (
    <>
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
              <Text>Switch workspace:</Text>
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
            onClick={onOpenCreateOrg}
          >
            <HStack>
              <Icon as={HiPlus}></Icon>
              <Text>Create Organization</Text>
            </HStack>
          </MenuItem>
        </MenuList>
      </Menu>
      <Modal isOpen={isOpenCreateOrg} onClose={onCloseCreateOrg}>
        <ModalOverlay />
        <ModalContent>
          <form onSubmit={handleCreateOrgSubmit}>
            <ModalHeader>Create an Organization</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl>
                <FormLabel fontSize="sm">Organization account name</FormLabel>
                <Input
                  type="text"
                  name="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.currentTarget.value)}
                />
                {organizationName.length > 0 &&
                  slugify(organizationName).length > 2 && (
                    <>
                      <FormHelperText>
                        This will be your account name on Zipper.
                      </FormHelperText>
                      <FormHelperText>{`The url for your organization will be: ${
                        process.env.NEXT_PUBLIC_HOST
                      }/${slugify(organizationName)}`}</FormHelperText>
                    </>
                  )}

                {organizationName.length > 0 &&
                  slugify(organizationName).length < 3 && (
                    <>
                      <FormHelperText>
                        The name must contain at least 3 alphanumeric
                        characters.
                      </FormHelperText>
                    </>
                  )}
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseCreateOrg}>
                Close
              </Button>
              <Button colorScheme="purple" type="submit">
                Create
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

export default OrganizationSwitcher;
