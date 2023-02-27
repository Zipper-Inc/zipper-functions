import {
  Button,
  AvatarGroup,
  Box,
  HStack,
  Heading,
  Link,
  Text,
  AvatarBadge,
  Tooltip,
  Icon,
  useBreakpointValue,
  Flex,
} from '@chakra-ui/react';

import NextLink from 'next/link';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import React from 'react';
import ForkIcon from '~/components/svg/forkIcon';
import { ZipperSymbol } from '~/components/svg/zipperSymbol';
import { ZipperLogo } from '@zipper/ui';
import { useSelf, useOthers } from '~/liveblocks.config';
import { Avatar } from '../avatar';
import { HiLightningBolt, HiOutlineShare } from 'react-icons/hi';
import { useUser, SignedIn, SignedOut } from '@clerk/nextjs';
import { AppQueryOutput } from '~/types/trpc';
import { useRunAppContext } from '../context/run-app-context';

const isEditorOnline = (onlineEditorIds: string[], id: string) =>
  onlineEditorIds.includes(id);

const isAnonId = (id?: string) => id?.startsWith('anon-');

function PlaygroundAvatars({
  editorIds,
  onlineEditorIds,
  selfId,
}: {
  editorIds: string[];
  onlineEditorIds: string[];
  selfId?: string;
}) {
  const isSelfAnon = isAnonId(selfId);

  return (
    <AvatarGroup>
      {editorIds.map((id, index) => {
        const isFirst = index === 0;
        const isOnline = isEditorOnline(onlineEditorIds, id);
        const isSelf = id === selfId;
        const isAnon = isAnonId(id);
        const connected = !!selfId;

        let grayscale;
        if (!connected || isFirst) grayscale = 0;
        else if (isOnline) grayscale = 50;
        else grayscale = 20;

        let tooltip;
        if (!connected) tooltip = null;
        else if (isSelf && isFirst) tooltip = 'You';
        else if (isSelf) tooltip = 'You (on another tab or device)';
        else if (isAnon) tooltip = 'Anonymous editor';
        else if (isOnline) tooltip = 'Currently editing';
        else if (!isSelfAnon) tooltip = 'Inactive';

        return (
          <Avatar
            key={`${id}-${index}`}
            userId={id}
            size="xs"
            filter={`grayscale(${grayscale}%)`}
          >
            {connected && !isSelfAnon && !isFirst && isOnline && (
              <AvatarBadge boxSize="1em" bg="green.500" />
            )}
            {tooltip && (
              <Tooltip label={tooltip} fontSize="xs">
                <Box position="absolute" inset={0} boxSize="100%" />
              </Tooltip>
            )}
          </Avatar>
        );
      })}
    </AvatarGroup>
  );
}

export function PlaygroundHeader({
  app,
  onClickShare,
  onClickFork,
}: {
  app: AppQueryOutput;
  onClickShare: (e: React.MouseEvent<HTMLElement>) => any;
  onClickFork: (e: React.MouseEvent<HTMLElement>) => any;
}) {
  const { isLoaded } = useUser();
  const self = useSelf();
  const others = useOthers();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const { run: onClickRun, isRunning } = useRunAppContext();

  // Get a list of active people in this app
  const onlineEditorIds = others.map(({ id }) => id as string);

  // put self at the top
  if (self) onlineEditorIds.unshift(self.id as string);

  // now add anyone that's an editor and offline
  const editorIds = [...onlineEditorIds];
  app.editors.map((editor: any) => {
    const superTokenId = editor?.user?.superTokenId;
    if (superTokenId && !onlineEditorIds.includes(superTokenId))
      editorIds.push(superTokenId);
  });

  return (
    <Flex
      as="header"
      gap={4}
      margin="auto"
      maxW="full"
      minW="md"
      justifyContent="center"
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
          <Heading as="h1" size="md" overflow="auto" whiteSpace="nowrap">
            {app.slug}
          </Heading>
        </HStack>
        {!isMobile && (
          <PlaygroundAvatars
            editorIds={editorIds}
            onlineEditorIds={onlineEditorIds}
            selfId={self?.id}
          />
        )}
      </HStack>
      <HStack justifyContent="end">
        {app.canUserEdit && (
          <Button variant={'outline'} onClick={onClickShare}>
            <HiOutlineShare />
          </Button>
        )}
        {app.canUserEdit && (
          <Button
            type="button"
            paddingX={4}
            variant="solid"
            colorScheme="purple"
            textColor="gray.100"
            onClick={onClickRun}
            disabled={isRunning}
          >
            <Icon as={HiLightningBolt} />
            <Text ml="2">Run</Text>
          </Button>
        )}
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
