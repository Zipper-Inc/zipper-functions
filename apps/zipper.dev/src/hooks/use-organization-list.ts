import { OrganizationInvitation } from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { SessionOrganizationMembership } from '~/pages/api/auth/[...nextauth]';
import { trpc } from '~/utils/trpc';

export const useOrganizationList = () => {
  const session = useSession();

  const [organizationList, setOrganizationList] = useState<
    SessionOrganizationMembership[]
  >([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | undefined
  >();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (session.status === 'authenticated') {
      setIsAuthed(true);
      setOrganizationList(session.data.organizationMemberships || []);
      setCurrentOrganizationId(session.data.currentOrganizationId);
    }

    if (session.status !== 'loading') {
      setIsLoaded(true);
    }
  }, [session.status, session.data]);

  const createOrganization = trpc.useMutation('organization.add', {
    onSuccess: (data) => {
      session.update({
        updateOrganizationList: true,
        currentOrganizationId: data.id,
      });
    },
  });

  return {
    createOrganization: async (name: string) => {
      return createOrganization.mutateAsync({ name });
    },
    organizationList,
    isLoaded,
    currentOrganizationId,
    setActive: isAuthed
      ? (organizationId: string | null) => {
          session.update({ currentOrganizationId: organizationId });
        }
      : undefined,
  };
};
