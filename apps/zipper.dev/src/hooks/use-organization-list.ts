import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { SessionOrganizationMembership } from '~/pages/api/auth/[...nextauth]';
import { trpc } from '~/utils/trpc';
import { useAnalytics } from './use-analytics';
import { useUser } from './use-user';

export const useOrganizationList = () => {
  const session = useSession();
  const analytics = useAnalytics();
  const { user } = useUser();

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
      analytics?.identify(user?.username, {
        email: user?.email,
      });

      analytics?.group(name.toLocaleLowerCase().replace(' ', '.'), {
        name,
      });

      analytics?.track('Created Org', {
        email: user?.email,
        company: name,
      });
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
