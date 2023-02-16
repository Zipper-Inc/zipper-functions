import { useUser, useOrganizationList } from '@clerk/nextjs';
import { inferQueryOutput } from '~/utils/trpc';

export type AppOwner = { name: string; type: 'user' | 'org' };
type _App = Unpack<inferQueryOutput<'app.byAuthedUser'>>;

export const useAppOwner = () => {
  const { user } = useUser();
  const { organizationList } = useOrganizationList();
  const getAppOwner = <T extends Pick<_App, 'resourceOwner' | 'createdById'>>(
    app: T,
  ): AppOwner => {
    if (
      app.resourceOwner.resourceOwnerId === user?.id ||
      app.createdById === user?.id
    ) {
      return { name: 'You', type: 'user' };
    }
    const orgName =
      organizationList?.find(
        ({ organization }) =>
          organization.id === app.resourceOwner.resourceOwnerId,
      )?.organization.name ?? '';
    return { name: orgName, type: 'org' };
  };
  return { getAppOwner };
};
