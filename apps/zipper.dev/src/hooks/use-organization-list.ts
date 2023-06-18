import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { trpc } from '~/utils/trpc';

export const useOrganizationList = () => {
  const session = useSession();

  const [organizationList, setOrganizationList] = useState<
    {
      organization: { id: string; name: string; slug: string };
      role: string;
    }[]
  >([]);
  const [currentOrganizationId, setCurrentOrganizationId] = useState<
    string | undefined
  >();
  const [isLoaded, setIsLoaded] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    if (session.status === 'authenticated') {
      console.log(session.data);
      setIsAuthed(true);
      setOrganizationList(session.data.organizationMemberships);
      setCurrentOrganizationId(session.data.currentOrganizationId);
    }

    if (session.status !== 'loading') {
      setIsLoaded(true);
    }
  }, [session.status, session.data]);

  const createOrganization = trpc.useMutation('organization.add', {
    onSuccess: () => {
      session.update({ updateOrganizationList: true });
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
