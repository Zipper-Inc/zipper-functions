import {
  AvatarGroup,
  Box,
  HStack,
  Heading,
  Link,
  Text,
  AvatarBadge,
  Tooltip,
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import React from 'react';
import ForkIcon from '~/components/svg/forkIcon';
import { ZipperLogo } from '~/components/svg/zipper-logo';
import { useSelf, useOthers } from '~/liveblocks.config';
import { Avatar } from '../avatar';

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
            superTokenId={id}
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
  isUserAnAppEditor,
  onOpenAppRun,
  onOpenSchedule,
  onOpenSecrets,
}: {
  app: any;
  isUserAnAppEditor: boolean;
  onOpenAppRun: () => void;
  onOpenSchedule: () => void;
  onOpenSecrets: () => void;
}) {
  const self = useSelf();
  const others = useOthers();

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
    <>
      <Box pb={5}>
        <HStack>
          <Box mr={5} height={4}>
            <Link href="/">
              <ZipperLogo style={{ maxHeight: '100%' }} />
            </Link>
          </Box>
          <Box>
            {app.isPrivate ? (
              <LockIcon fill={'gray.500'} boxSize={4} mb={1} />
            ) : (
              <UnlockIcon color={'gray.500'} boxSize={4} mb={1} />
            )}
          </Box>
          {app.parentId && (
            <Box>
              <Link href={`/app/${app.parentId}/edit`} target="_blank">
                <ForkIcon fill={'gray.300'} size={16} />
              </Link>
            </Box>
          )}
          <Heading as="h1" size="md">
            {app.slug}
          </Heading>
          <PlaygroundAvatars
            editorIds={editorIds}
            onlineEditorIds={onlineEditorIds}
            selfId={self?.id}
          />
        </HStack>
      </Box>
      <HStack gap={2}>
        <Text
          fontWeight={600}
          borderBottom="1px solid"
          borderBottomColor={'purple.600'}
        >
          Code
        </Text>
        <Text>|</Text>
        {isUserAnAppEditor && (
          <>
            <Link onClick={onOpenAppRun}>Runs</Link>
            <Link onClick={onOpenSchedule}>Schedules</Link>
          </>
        )}
        <Link onClick={onOpenSecrets}>Secrets</Link>
      </HStack>
    </>
  );
}
