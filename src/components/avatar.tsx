import { User } from '@prisma/client';
import { trpc } from '~/utils/trpc';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { SessionContextUpdate } from 'supertokens-auth-react/lib/build/recipe/session/types';
import { Avatar as BaseAvatar, AvatarProps } from '@chakra-ui/react';

const DEFAULT_AVATAR_BOX_SIZE = 8;
const DEFAULT_AVATAR_NAME = '';
const DEFAULT_AVATAR_SRC = '';

export function AvatarForUser({
  user,
  ...props
}: { user?: User } & AvatarProps) {
  const name = user?.name || user?.email || props?.name || DEFAULT_AVATAR_NAME;
  const src = user?.picture || props?.src || DEFAULT_AVATAR_SRC;

  return (
    <BaseAvatar
      boxSize={DEFAULT_AVATAR_BOX_SIZE}
      name={name}
      src={src}
      {...props}
    />
  );
}

export function AvatarForCurrentUser(props: AvatarProps) {
  const session = useSessionContext() as SessionContextUpdate & {
    loading: boolean;
  };

  const userQuery = trpc.useQuery(
    ['user.bySuperTokenId', { superTokenId: session.userId }],
    {
      enabled: !session.loading,
    },
  );

  return <AvatarForUser user={userQuery?.data as User} {...props} />;
}

export function AvatarForUserId({
  userId,
  ...props
}: { userId: string } & AvatarProps) {
  const userQuery = trpc.useQuery(['user.byId', { id: userId }]);
  return <AvatarForUser user={userQuery?.data as User} {...props} />;
}

export function Avatar({
  user,
  userId,
  ...props
}: { user?: User; userId?: string } & AvatarProps) {
  if (userId) return <AvatarForUserId userId={userId as string} {...props} />;
  if (user) return <AvatarForUser user={user} {...props} />;
  return <BaseAvatar {...props} />;
}
