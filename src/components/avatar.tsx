import { trpc } from '~/utils/trpc';
import { Avatar as BaseAvatar, AvatarProps } from '@chakra-ui/react';
import { useUser } from '@clerk/nextjs';

export function AvatarForUserId({
  userId,
  ...props
}: { userId: string } & AvatarProps) {
  const userQuery = trpc.useQuery(['user.profileForUserId', { id: userId }]);
  return (
    <BaseAvatar
      name={userQuery?.data?.fullName || ''}
      src={userQuery?.data?.profileImageUrl}
      {...props}
    />
  );
}

export function AvatarForCurrentUser(props: AvatarProps) {
  const { user } = useUser();
  return (
    <BaseAvatar
      name={user?.fullName || ''}
      {...props}
      src={user?.profileImageUrl || ''}
    />
  );
}

export function Avatar({
  userId,
  ...props
}: { userId?: string } & AvatarProps) {
  const { user } = useUser();
  if (user && user.id === userId) return <AvatarForCurrentUser {...props} />;

  if (userId) return <AvatarForUserId userId={userId as string} {...props} />;

  return <BaseAvatar {...props} />;
}
