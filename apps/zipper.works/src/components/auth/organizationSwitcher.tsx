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
  InputGroup,
  InputRightElement,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { HiOutlineChevronUpDown, HiPlus } from 'react-icons/hi2';
import { HiSwitchHorizontal, HiCog, HiX } from 'react-icons/hi';
import { FormEventHandler, useEffect, useState } from 'react';
import slugify from '~/utils/slugify';

import { trpc } from '~/utils/trpc';
import { CheckIcon } from '@chakra-ui/icons';
import { useDebounce } from 'use-debounce';

const MIN_SLUG_LENGTH = 3;

export const OrganizationSwitcher = () => {
  // get the authed user's organizations from Clerk
  const { setActive, organizationList, isLoaded } = useOrganizationList();
  if (!isLoaded) return <></>;

  const { organization, membership } = useOrganization();
  const { createOrganization } = useOrganizationList();

  const router = useRouter();

  const {
    isOpen: isOpenCreateOrg,
    onOpen: onOpenCreateOrg,
    onClose: onCloseCreateOrg,
  } = useDisclosure();

  const [organizationName, setOrganizationName] = useState('');
  const [hoverOrg, setHoverOrg] = useState<string | undefined | null>(
    undefined,
  );
  const [slugExists, setSlugExists] = useState<boolean | undefined>();
  const [slug, setSlug] = useState<string>('');
  const [debouncedSlug] = useDebounce(slug, 200);

  const organizationSlugQuery = trpc.useQuery(
    ['organizationSlug.find', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length > 2) },
  );

  const createOrganizationSlug = trpc.useMutation('organizationSlug.add');

  const allWorkspaces = [
    { organization: { id: null, name: 'Personal Workspace' } },
    ...(organizationList || []),
  ];

  const workspacesExcludingCurrent = allWorkspaces.filter((o) => {
    return o.organization.id !== (organization?.id || null);
  });

  useEffect(() => {
    setSlugExists(!!organizationSlugQuery.data);
  }, [organizationSlugQuery.data]);

  useEffect(() => {
    const s = slugify(organizationName);
    setSlug(s);
  }, [organizationName]);

  const handleCreateOrgSubmit: FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();
    if (!createOrganization) return;
    const newOrg = await createOrganization({ name: organizationName, slug });
    await createOrganizationSlug.mutateAsync(
      {
        slug,
        organizationId: newOrg.id,
      },
      {
        onError: (e) => {
          console.error(e);
        },
      },
    );
    setActive && setActive({ organization: newOrg.id });
    router.push(`${router.pathname}?reload=true`);
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
          {workspacesExcludingCurrent.length > 0 && (
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
          {workspacesExcludingCurrent.map((org) => {
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
                <InputGroup>
                  <Input
                    type="text"
                    name="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.currentTarget.value)}
                  />
                  {slug && slug.length >= MIN_SLUG_LENGTH && (
                    <InputRightElement
                      children={
                        slugExists ? (
                          <Icon as={HiX} color="red.500" />
                        ) : (
                          <CheckIcon color="green.500" />
                        )
                      }
                    />
                  )}
                </InputGroup>

                {slugExists ? (
                  <>
                    <FormHelperText>
                      {`The name ${slug} is already taken.`}
                    </FormHelperText>
                  </>
                ) : (
                  <>
                    {organizationName.length > 0 && slug && slug.length > 2 && (
                      <>
                        <FormHelperText>
                          This will be your account name on Zipper.
                        </FormHelperText>
                        <FormHelperText>{`The url for your organization will be: ${process.env.NEXT_PUBLIC_HOST}/${slug}`}</FormHelperText>
                      </>
                    )}

                    {organizationName.length > 0 &&
                      (!slug || slug.length < MIN_SLUG_LENGTH) && (
                        <>
                          <FormHelperText>
                            {`The name must contain at least ${MIN_SLUG_LENGTH} alphanumeric
                        characters.`}
                          </FormHelperText>
                        </>
                      )}
                  </>
                )}
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onCloseCreateOrg}>
                Close
              </Button>
              <Button
                colorScheme="purple"
                type="submit"
                isDisabled={slugExists || slug.length < MIN_SLUG_LENGTH}
              >
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
