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
} from '@chakra-ui/react';

import NextLink from 'next/link';
import { CheckIcon } from '@chakra-ui/icons';
import React, { useEffect, useState } from 'react';
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

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
});

export function PlaygroundHeader({ app }: { app: AppQueryOutput }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isLoaded } = useUser();
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
      <HStack spacing={4} alignItems="center" flex={1} minW={0}>
        <Box
          height={4}
          display={'flex'}
          flexDirection={'row'}
          alignItems={'center'}
          gap={2}
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
            alignItems={'center'}
            display={'flex'}
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
          overflow="auto"
          whiteSpace="nowrap"
          fontWeight="medium"
          color="fg.400"
        >
          /
        </Heading>
        <NextLink href={`/${app.resourceOwner.slug}`}>
          <Heading
            size="md"
            overflow="auto"
            whiteSpace="nowrap"
            fontWeight="medium"
            color="fg.600"
          >
            {app.resourceOwner.slug}
          </Heading>
        </NextLink>

        <Heading
          size="md"
          overflow="auto"
          whiteSpace="nowrap"
          fontWeight="medium"
          color="fg.400"
        >
          /
        </Heading>

        <Heading
          as="h1"
          size="md"
          overflow="auto"
          whiteSpace="nowrap"
          fontWeight="semibold"
        >
          {app.slug}
        </Heading>
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
        {isLoaded && (
          <Button
            size="sm"
            colorScheme="gray"
            variant="outline"
            leftIcon={<PiGitBranchDuotone color={PURPLE} />}
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
            Fork
          </Button>
        )}
        <Button
          size="sm"
          colorScheme="gray"
          variant="outline"
          onClick={() => setShareModalOpen(true)}
          fontWeight="medium"
          leftIcon={<PiShareNetworkDuotone color={ORANGE} />}
        >
          <Text>Share</Text>
        </Button>
        <Button
          as={Link}
          size="sm"
          colorScheme="gray"
          variant="outline"
          href={`${
            process.env.NODE_ENV === 'production' ? 'https://' : 'http://'
          }${getAppLink(app.slug)}`}
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
