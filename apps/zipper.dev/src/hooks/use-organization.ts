import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { SessionOrganization } from '~/pages/api/auth/[...nextauth]';

export const useOrganization = () => {
  const session = useSession();

  const [organization, setOrganization] = useState<
    SessionOrganization | undefined
  >();
  const [role, setRole] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (session.status === 'authenticated') {
      const orgMembership = session.data.currentOrganizationId
        ? session.data.organizationMemberships?.find(
            (om) => om.organization.id === session.data.currentOrganizationId,
          )
        : undefined;
      setOrganization(orgMembership?.organization);
      setRole(orgMembership?.role);
    }

    if (session.status !== 'loading') {
      setIsLoaded(true);
    }
  }, [session.status, session.data]);

  return {
    isLoaded,
    organization,
    role,
  };
};
