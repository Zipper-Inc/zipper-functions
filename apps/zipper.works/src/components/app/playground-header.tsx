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
} from '@chakra-ui/react';

import NextLink from 'next/link';
import { CheckIcon, LockIcon, UnlockIcon } from '@chakra-ui/icons';
import React, { useEffect, useState } from 'react';
import ForkIcon from '~/components/svg/forkIcon';
import { ZipperLogo, ZipperSymbol } from '@zipper/ui';
import { HiPencilAlt } from 'react-icons/hi';
import {
  useUser,
  SignedIn,
  SignedOut,
  useOrganization,
  useOrganizationList,
} from '@clerk/nextjs';
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
import SignInButton from '../auth/signInButton';

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultSlug(),
  description: '',
  isPublic: false,
});

export function PlaygroundHeader({ app }: { app: AppQueryOutput }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, isLoaded } = useUser();
  const [editSlug, setEditSlug] = useState(false);
  const { editorIds, onlineEditorIds } = useAppEditors();
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      if (router.query?.fork) {
        onOpen();
      }
    }
  }, [router.isReady]);

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
    <Flex as="header" gap={4} maxW="full" minW="md" justifyContent="center">
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
        <HStack spacing={2} alignItems="center" minW={0}>
          <Box>
            {app.isPrivate ? (
              <Icon as={LockIcon} color={'gray.500'} boxSize={4} mb={1} />
            ) : (
              <Icon as={UnlockIcon} color={'gray.400'} boxSize={4} mb={1} />
            )}
          </Box>
          {app.parentId && (
            <Box>
              <Link href={`/app/${app.parentId}/edit`} target="_blank">
                <Icon as={ForkIcon} color={'gray.400'} size={16} />
              </Link>
            </Box>
          )}
        </HStack>
        <HStack>
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
        {!user && <SignInButton />}
        {!app.canUserEdit && isLoaded && (
          <Button
            type="button"
            paddingX={6}
            variant="outline"
            borderColor="purple.800"
            textColor="purple.800"
            onClick={() => {
              if (user) {
                onOpen();
              } else {
                router.push(
                  `/sign-in?redirect=${window.location.pathname}?fork=1`,
                );
              }
            }}
          >
            Fork
          </Button>
        )}
      </HStack>
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
                    if (app.canUserEdit) return;
                    if (user) {
                      if (
                        (selectedOrganizationId ?? null) !==
                          (organization?.id ?? null) &&
                        setActive
                      ) {
                        await setActive({
                          organization: selectedOrganizationId,
                        });
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
