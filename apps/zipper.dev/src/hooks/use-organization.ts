import {
  OrganizationInvitation,
  OrganizationMembership,
  User,
} from '@prisma/client';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { SessionOrganization } from '~/pages/api/auth/[...nextauth]';
import { trpc } from '~/utils/trpc';

type Props = {
  membershipList?: {
    cursor?: string;
    limit?: number;
  };
  invitationList?: {
    cursor?: string;
    limit?: number;
  };
};

export const useOrganization = (props?: Props) => {
  let membershipListProps: Props['membershipList'];
  let invitationListProps: Props['invitationList'];

  if (props) {
    membershipListProps = props.membershipList;
    invitationListProps = props.invitationList;
  }

  const session = useSession();

  const [organization, setOrganization] = useState<
    SessionOrganization | undefined
  >();
  const [role, setRole] = useState<string | undefined>();
  const [isLoaded, setIsLoaded] = useState(false);
  const [membershipList, setMembershipList] = useState<
    | (OrganizationMembership & {
        user: Omit<User, 'emailVerified' | 'createdAt' | 'updatedAt'>;
      })[]
    | undefined
  >();
  const [invitationList, setInvitationList] = useState<
    Omit<OrganizationInvitation, 'token' | 'redirectUrl'>[] | undefined
  >();

  trpc.useQuery(['organization.getMemberships'], {
    enabled: !!membershipListProps && session.status === 'authenticated',
    onSuccess: (data) => {
      setMembershipList(data);
    },
  });

  trpc.useQuery(['organization.getPendingInvitations'], {
    enabled: !!invitationListProps && session.status === 'authenticated',
    onSuccess: (data) => {
      setInvitationList(data);
    },
  });

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
    invitationList,
    membershipList,
    role,
  };
};
