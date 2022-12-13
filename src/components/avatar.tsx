import { User } from '@prisma/client';
import { trpc } from '~/utils/trpc';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import { SessionContextUpdate } from 'supertokens-auth-react/lib/build/recipe/session/types';
import { Avatar as BaseAvatar, AvatarProps } from '@chakra-ui/react';

export function AvatarForUser({
  user,
  ...props
}: { user?: User } & AvatarProps) {
  const name = user?.name || user?.email || props?.name || '';
  const src = user?.picture || props?.src || '';
  return <BaseAvatar name={name} src={src} {...props} />;
}

export function AvatarForUserId({
  userId,
  ...props
}: { userId: string } & AvatarProps) {
  const userQuery = trpc.useQuery(['user.byId', { id: userId }]);
  return <AvatarForUser user={userQuery?.data as User} {...props} />;
}

export function AvatarForSuperTokenId({
  superTokenId,
  ...props
}: { superTokenId: string } & AvatarProps) {
  const userQuery = trpc.useQuery(['user.bySuperTokenId', { superTokenId }]);
  return <AvatarForUser user={userQuery?.data as User} {...props} />;
}

export function AvatarForCurrentUser(props: AvatarProps) {
  const session = useSessionContext() as SessionContextUpdate & {
    loading: boolean;
  };
  return <AvatarForSuperTokenId superTokenId={session.userId} {...props} />;
}

export function Avatar({
  user,
  userId,
  superTokenId,
  ...props
}: { user?: User; userId?: string; superTokenId?: string } & AvatarProps) {
  if (superTokenId)
    return (
      <AvatarForSuperTokenId superTokenId={superTokenId as string} {...props} />
    );

  if (userId) return <AvatarForUserId userId={userId as string} {...props} />;

  if (user) return <AvatarForUser user={user} {...props} />;

  return <BaseAvatar {...props} />;
}
