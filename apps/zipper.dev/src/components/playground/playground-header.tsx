import {
  Button,
  Box,
  HStack,
  Heading,
  Link,
  Icon,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  Tooltip,
  Spacer,
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';

import NextLink from 'next/link';
import { CheckIcon } from '@chakra-ui/icons';
import React, { memo, useEffect, useState } from 'react';
import { BLUE, ORANGE, PURPLE, ZipperLogo, ZipperSymbol } from '@zipper/ui';

import { AppQueryOutput } from '~/types/trpc';
import { useAppEditors } from '~/hooks/use-app-editors';
import {
  PiWarning,
  PiLockSimpleBold,
  PiSignInDuotone,
  PiShareNetworkDuotone,
  PiBrowserDuotone,
  PiGitBranchDuotone,
  PiGitBranchBold,
  PiLockSimpleOpenBold,
} from 'react-icons/pi';
import slugify from 'slugify';
import { OrganizationSelector } from '../dashboard/organization-selector';
import { useForm } from 'react-hook-form';
import { useAppSlug, MIN_SLUG_LENGTH } from '~/hooks/use-app-slug';
import { trpc } from '~/utils/trpc';
import { generateDefaultSlug } from '~/utils/generate-default';
import { useRouter } from 'next/router';
import ShareModal from './share-modal';
import { useUser } from '~/hooks/use-user';
import { useOrganization } from '~/hooks/use-organization';
import { useOrganizationList } from '~/hooks/use-organization-list';
import SignedIn from '../auth/signed-in';
import SignedOut from '../auth/signed-out';
import { signIn } from 'next-auth/react';
import { PlaygroundPublishInfo } from './playground-publish-button';
import { getAppLink } from '@zipper/utils';
import { UserProfileButton } from '../auth/user-profile-button';
import { FiMoreHorizontal } from 'react-icons/fi';
import { useEditorContext } from '../context/editor-context';

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
});

export function PlaygroundHeader({ app }: { app: AppQueryOutput }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isLoaded } = useUser();
  const [isShareModalOpen, setShareModalOpen] = useState(false);
  const { currentScript } = useEditorContext();

  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      if (router.query?.fork) {
        onOpen();
      }
    }
  }, [router.isReady]);

  const parentApp = trpc.app.byId.useQuery(
    { id: app.parentId! },
    {
      enabled: !!app.parentId,
    },
  );
  const { organization } = useOrganization();
  const { setActive } = useOrganizationList();
  const forkApp = trpc.app.fork.useMutation({
    async onSuccess(data: any) {
      router.push(`/app/${data.id}/edit`);
    },
  });

  const [selectedOrganizationId, setSelectedOrganizationId] = useState<
    string | null | undefined
  >(organization?.id);

  const [slug, setSlug] = useState<string>('');

  const forkAppForm = useForm({
    defaultValues: getDefaultCreateAppFormValues(),
  });

  useEffect(() => {
    setSlug(slugify(forkAppForm.getValues('name')));
  }, []);

  useEffect(() => {
    setSelectedOrganizationId(organization?.id);
  }, [organization?.id]);

  const resetForm = () => {
    const defaultValue = getDefaultCreateAppFormValues();
    forkAppForm.reset(defaultValue);
    setSlug(slugify(defaultValue.name));
    setSelectedOrganizationId(organization?.id);
  };

  const { slugExists, appSlugQuery } = useAppSlug(slug);
  const isSlugValid =
    appSlugQuery.isFetched && slug && slug.length >= MIN_SLUG_LENGTH;
  const isDisabled = slugExists || slug.length < MIN_SLUG_LENGTH;

  const getViewLink = () =>
    `${
      process.env.NODE_ENV === 'production' ? 'https://' : 'http://'
    }${getAppLink(app.slug)}/${
      currentScript?.isRunnable ? currentScript?.filename : ''
    }`;

  return (
    <Flex
      as="header"
      gap={4}
      maxW="full"
      minW={{ base: 'full', md: 'md' }}
      justifyContent="center"
      pt="1"
      pb="1"
      data-playground-header
    >
      <HStack spacing={4} alignItems="center" flex={1} minW={0}>
        <Box
          height={4}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          gap={{ base: 1, md: 2 }}
        >
          <NextLink href="/">
            <SignedIn>
              <ZipperSymbol
                fill={BLUE}
                middle={{ fill: BLUE }}
                style={{
                  maxHeight: '100%',
                  width: '20px',
                  marginLeft: '5px',
                }}
              />
            </SignedIn>
            <SignedOut>
              <ZipperLogo
                fill={BLUE}
                height={20}
                style={{
                  marginLeft: '5px',
                  width: '140px',
                }}
              />
            </SignedOut>
          </NextLink>

          <Box
            bgColor={'blue.50'}
            _dark={{
              bgColor: 'blue.900',
            }}
            alignItems={'center'}
            display={{ base: 'none', md: 'flex' }}
            px={2}
            py={1}
          >
            <Text
              fontSize={'x-small'}
              textTransform="uppercase"
              fontWeight={'bold'}
              color={'indigo.600'}
              cursor="default"
            >
              Beta
            </Text>
          </Box>
        </Box>
        <Heading
          size="md"
          lineHeight="base"
          whiteSpace="nowrap"
          display={{ base: 'none', md: 'block' }}
          fontWeight="medium"
          color="fg.400"
        >
          /
        </Heading>
        <NextLink href={`/${app.resourceOwner.slug}`}>
          <Heading
            size="md"
            display={{ base: 'none', md: 'block' }}
            lineHeight="base"
            whiteSpace="nowrap"
            fontWeight="medium"
            color="fg.600"
          >
            {app.resourceOwner.slug}
          </Heading>
        </NextLink>

        <Heading
          size="md"
          lineHeight="base"
          display={{ base: 'none', md: 'block' }}
          whiteSpace="nowrap"
          fontWeight="medium"
          color="fg.400"
        >
          /
        </Heading>

        <Box
          maxW="full"
          overflow={{ base: 'hidden', md: undefined }}
          whiteSpace={{ base: 'nowrap', md: undefined }}
        >
          <Heading
            as="h1"
            size="md"
            lineHeight="base"
            textOverflow={{ base: 'ellipsis', md: undefined }}
            whiteSpace="nowrap"
            fontWeight="semibold"
          >
            {app.slug}
          </Heading>
        </Box>
        {app.parentId && parentApp.data && (
          <Tooltip
            label={`Forked from ${parentApp.data.name || parentApp.data.slug}`}
            bg={BLUE}
            placement="right"
            fontSize="xs"
          >
            <Link
              href={`/app/${app.parentId}/edit`}
              target="_blank"
              color={BLUE}
            >
              <PiGitBranchBold />
            </Link>
          </Tooltip>
        )}
        <Tooltip
          label={
            app.isPrivate
              ? 'This code is private, only org members and invitees can view this code'
              : 'This code is open-source, anyone with the link can read and fork it'
          }
          bg={BLUE}
          placement="right"
          fontSize="xs"
        >
          <Text color={BLUE}>
            {app.isPrivate ? (
              <PiLockSimpleBold color={BLUE} />
            ) : (
              <PiLockSimpleOpenBold />
            )}
          </Text>
        </Tooltip>
      </HStack>
      <HStack justifyContent="end">
        {/**
         * Extra Actions Menu
         * it appears only on mobile devices.
         */}
        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FiMoreHorizontal />}
            colorScheme="purple"
            variant="ghost"
            display={{ base: 'flex', xl: 'none' }}
          />
          <MenuList>
            <MenuItem
              icon={<PiGitBranchDuotone />}
              onClick={() => {
                if (user) {
                  onOpen();
                } else {
                  signIn(undefined, {
                    callbackUrl: `${window.location.pathname}?fork=1`,
                  });
                }
              }}
            >
              Fork
            </MenuItem>
            <MenuItem
              icon={<PiShareNetworkDuotone />}
              onClick={() => setShareModalOpen(true)}
            >
              Share
            </MenuItem>
            <MenuItem
              icon={<PiBrowserDuotone />}
              display={{ base: 'flex', md: 'none' }}
              as={Link}
              href={getViewLink()}
            >
              View
            </MenuItem>
          </MenuList>
        </Menu>

        {isLoaded && (
          <Button
            size="sm"
            display={{ base: 'none', xl: 'flex' }}
            colorScheme="gray"
            variant="outline"
            leftIcon={<PiGitBranchDuotone color={PURPLE} />}
            fontWeight="medium"
            onClick={() => {
              if (user) {
                onOpen();
              } else {
                signIn(undefined, {
                  callbackUrl: `${window.location.href}?fork=1`,
                });
              }
            }}
          >
            Fork
          </Button>
        )}
        <SignedIn>
          <Button
            size="sm"
            colorScheme="gray"
            display={{ base: 'none', xl: 'flex' }}
            variant="outline"
            onClick={() => setShareModalOpen(true)}
            fontWeight="medium"
            leftIcon={<PiShareNetworkDuotone color={ORANGE} />}
          >
            <Text>Share</Text>
          </Button>
        </SignedIn>
        <Button
          as={Link}
          size="sm"
          colorScheme="gray"
          display={{ base: 'none', md: 'flex' }}
          variant="outline"
          href={getViewLink()}
          target="_blank"
          leftIcon={<PiBrowserDuotone color={BLUE} />}
          fontWeight="medium"
        >
          <Text>View</Text>
        </Button>
        <SignedIn>
          {app.canUserEdit && <PlaygroundPublishInfo app={app} />}
          <Spacer />
          <UserProfileButton showAdditionalOptions />
        </SignedIn>

        {!user && (
          <Button
            size="sm"
            colorScheme="purple"
            variant="outline"
            fontWeight="semibold"
            mr="3"
            leftIcon={<PiSignInDuotone />}
            onClick={() => {
              signIn();
            }}
          >
            Sign In
          </Button>
        )}
      </HStack>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setShareModalOpen(false)}
        appId={app.id}
      />
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalOverlay />
        <ModalContent maxH="2xl">
          <ModalHeader>Fork this app</ModalHeader>
          <ModalCloseButton />
          <ModalBody mb="4">
            <VStack align={'start'} gap={2}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <HStack spacing={1}>
                  <OrganizationSelector
                    setSelectedOrganizationId={setSelectedOrganizationId}
                    selectedOrganizationId={selectedOrganizationId}
                  />
                  <Text>/</Text>
                  <InputGroup>
                    <Input
                      backgroundColor="bgColor"
                      maxLength={60}
                      {...forkAppForm.register('name')}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                      }}
                    />
                    {isSlugValid && (
                      <InputRightElement
                        children={
                          slugExists ? (
                            <Icon as={PiWarning} color="red.500" />
                          ) : (
                            <CheckIcon color="green.500" />
                          )
                        }
                      />
                    )}
                  </InputGroup>
                </HStack>
                {forkAppForm.watch('name') && (
                  <FormHelperText>
                    {`Your app will be available at
                            ${slug}.${process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST}`}
                  </FormHelperText>
                )}
                <FormErrorMessage>
                  {forkAppForm.formState.errors.name?.message}
                </FormErrorMessage>
              </FormControl>
              <Box w="full">
                <Button
                  ml="auto"
                  display="block"
                  colorScheme="purple"
                  type="submit"
                  isDisabled={isDisabled}
                  onClick={forkAppForm.handleSubmit(async ({ name }) => {
                    if (user) {
                      forkApp.mutateAsync(
                        {
                          id: app.id,
                          name,
                          organizationId: selectedOrganizationId || undefined,
                        },
                        {
                          onSuccess: (fork) => {
                            router.push(
                              `/${fork.resourceOwner.slug}/${fork.slug}/src`,
                            );

                            resetForm();
                            onClose();
                          },
                        },
                      );
                    } else {
                      router.push(
                        `/sign-in?redirect=${window.location.pathname}`,
                      );
                    }
                  })}
                >
                  Fork
                </Button>
              </Box>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
}
