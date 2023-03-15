import {
  Button,
  Box,
  HStack,
  Heading,
  Link,
  Icon,
  Flex,
} from '@chakra-ui/react';

import NextLink from 'next/link';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import React, { useState } from 'react';
import ForkIcon from '~/components/svg/forkIcon';
import { ZipperSymbol } from '~/components/svg/zipperSymbol';
import { ZipperLogo } from '@zipper/ui';
import { HiPencilAlt } from 'react-icons/hi';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { AppQueryOutput } from '~/types/trpc';
import { EditAppSlugForm } from './edit-app-slug-form';
import { useAppEditors } from '~/hooks/use-app-editors';

export function PlaygroundHeader({
  app,
  onClickFork,
}: {
  app: AppQueryOutput;
  onClickFork: (e: React.MouseEvent<HTMLElement>) => any;
}) {
  const { isLoaded } = useUser();
  const [editSlug, setEditSlug] = useState(false);
  const { editorIds, onlineEditorIds } = useAppEditors();

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
            </>
          )}
        </HStack>
      </HStack>
      <HStack justifyContent="end">
        {!app.canUserEdit && isLoaded && (
          <Button
            type="button"
            paddingX={6}
            variant="outline"
            borderColor="purple.800"
            textColor="purple.800"
            onClick={onClickFork}
          >
            Fork
          </Button>
        )}
      </HStack>
    </Flex>
  );
}
