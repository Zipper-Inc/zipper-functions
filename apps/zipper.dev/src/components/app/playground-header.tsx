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
} from '@chakra-ui/react';

import NextLink from 'next/link';
import { CheckIcon } from '@chakra-ui/icons';
import React, { useEffect, useState } from 'react';
import { ZipperLogo, ZipperSymbol } from '@zipper/ui';

import {
  HiOutlineUpload,
  HiPencilAlt,
  HiLockOpen,
  HiLockClosed,
} from 'react-icons/hi';

import { CgGitFork } from 'react-icons/cg';

import { AppQueryOutput } from '~/types/trpc';
import { EditAppSlugForm } from './edit-app-slug-form';
import { useAppEditors } from '~/hooks/use-app-editors';
import { HiExclamationTriangle } from 'react-icons/hi2';
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

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
});

export function PlaygroundHeader({ app }: { app: AppQueryOutput }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isLoaded } = useUser();
  const [editSlug, setEditSlug] = useState(false);

  const [isShareModalOpen, setShareModalOpen] = useState(false);

  const { editorIds, onlineEditorIds } = useAppEditors();
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      if (router.query?.fork) {
        onOpen();
      }
    }
  }, [router.isReady]);

  const parentApp = trpc.useQuery(['app.byId', { id: app.parentId! }], {
    enabled: !!app.parentId,
  });
  const { organization } = useOrganization();
  const { setActive } = useOrganizationList();
  const forkApp = trpc.useMutation('app.fork', {
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

  app.editors.map((editor: any) => {
    const superTokenId = editor?.user?.superTokenId;
    if (superTokenId && !onlineEditorIds.includes(superTokenId))
      editorIds.push(superTokenId);
  });

  return (
    <Flex
      as="header"
      gap={4}
      maxW="full"
      minW="md"
      justifyContent="center"
      pt="1"
      pb="1"
    >
      <HStack spacing={3} alignItems="center" flex={1} minW={0}>
        <Box height={4}>
          <NextLink href="/">
            <SignedIn>
              <ZipperSymbol style={{ maxHeight: '100%' }} />
            </SignedIn>
            <SignedOut>
              <ZipperLogo style={{ maxHeight: '100%' }} />
            </SignedOut>
          </NextLink>
        </Box>
        <HStack>
          <NextLink href={`/${app.resourceOwner.slug}`}>
            <Heading
              as="h1"
              size="md"
              overflow="auto"
              whiteSpace="nowrap"
              fontWeight="medium"
              color="gray.600"
            >
              {app.resourceOwner.slug}
            </Heading>
          </NextLink>

          <Heading
            as="h1"
            size="md"
            overflow="auto"
            whiteSpace="nowrap"
            fontWeight="medium"
            color="gray.400"
          >
            /
          </Heading>

          <HStack spacing={2} alignItems="center" minW={0}>
            {app.isPrivate ? (
              <HiLockClosed color="gray.500" />
            ) : (
              <HiLockOpen color="gray.400" />
            )}
            {app.parentId && parentApp.data && (
              <Tooltip
                label={`Forked from ${
                  parentApp.data.name || parentApp.data.slug
                }`}
              >
                <Link href={`/app/${app.parentId}/edit`} target="_blank">
                  <CgGitFork />
                </Link>
              </Tooltip>
            )}
          </HStack>
          {editSlug ? (
            <EditAppSlugForm app={app} onClose={() => setEditSlug(false)} />
          ) : (
            <>
              <Heading as="h1" size="md" overflow="auto" whiteSpace="nowrap">
                {app.slug}
              </Heading>
              {app.canUserEdit && (
                <Button
                  variant="ghost"
                  rounded="full"
                  size="sm"
                  colorScheme="purple"
                  p={0}
                  onClick={() => {
                    setEditSlug(true);
                  }}
                >
                  <Box>
                    <HiPencilAlt />
                  </Box>
                </Button>
              )}
            </>
          )}
        </HStack>
      </HStack>
      <HStack justifyContent="end">
        {isLoaded && (
          <Button
            colorScheme="purple"
            variant="ghost"
            display="flex"
            gap={2}
            fontWeight="medium"
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
            <CgGitFork />
            Fork
          </Button>
        )}
        {!user && (
          <Button
            colorScheme="purple"
            display="flex"
            gap={2}
            fontWeight="medium"
            mr="3"
            onClick={() => {
              signIn();
            }}
          >
            Sign In
          </Button>
        )}
        <SignedIn>
          <Button
            colorScheme="purple"
            variant="ghost"
            onClick={() => setShareModalOpen(true)}
            display="flex"
            gap={2}
            fontWeight="medium"
          >
            <HiOutlineUpload />
            <Text>Share</Text>
          </Button>
          {/* <UserButton afterSignOutUrl="/" /> */}
        </SignedIn>
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
                      backgroundColor="white"
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
                            <Icon as={HiExclamationTriangle} color="red.500" />
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
                            ${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`}
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
                      if (
                        (selectedOrganizationId ?? null) !==
                          (organization?.id ?? null) &&
                        setActive
                      ) {
                        setActive(selectedOrganizationId || null);
                      }
                      forkApp.mutateAsync(
                        { id: app.id, name },
                        {
                          onSuccess: (fork) => {
                            router.push(
                              `/${fork.resourceOwner.slug}/${fork.slug}/edit`,
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
