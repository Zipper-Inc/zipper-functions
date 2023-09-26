import { useEffectOnce } from '@zipper/ui';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { trpc } from '~/utils/trpc';

export const AcceptInvitation = () => {
  const router = useRouter();
  const token = router.query.token as string;
  const session = useSession();

  const acceptInvitation = trpc.organization.acceptInvitation.useMutation();

  useEffectOnce(() => {
    acceptInvitation.mutateAsync(
      { token },
      {
        onSuccess: async (data) => {
          session.update({
            updateOrganizationList: true,
            currentOrganizationId: data,
          });
          router.push('/dashboard');
        },
      },
    );
  });
};

export default AcceptInvitation;
