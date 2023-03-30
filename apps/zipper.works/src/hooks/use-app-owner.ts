import { useUser, useOrganizationList } from '@clerk/nextjs';
import { ResourceOwnerType } from '@zipper/types';
import { inferQueryOutput } from '~/utils/trpc';

type _App = Unpack<inferQueryOutput<'app.byAuthedUser'>>;
export type AppOwner = {
  createdByAuthedUser: boolean;
  resourceOwnerType: ResourceOwnerType;
  resourceOwnerName: string;
  resourceOwnerSlug: string;
};

export const useAppOwner = () => {
  const { user } = useUser();
  const { organizationList } = useOrganizationList();
  const getAppOwner = <
    T extends Pick<_App, 'organizationId' | 'resourceOwner' | 'createdById'>,
  >(
    app: T,
  ): AppOwner => {
    const getOrg = (orgId: string) =>
      organizationList?.find(({ organization }) => organization.id === orgId);

    const getResourceOwnerName = () => {
      // app was created by currently authed user in personal workspace
      if (app.createdById === user?.id && !app.organizationId) {
        return user?.fullName || 'You';
      }

      // app was created by currently authed user within an organization
      if (app.createdById === user?.id && app.organizationId) {
        return (
          getOrg(app.organizationId)?.organization.name ||
          app.resourceOwner.slug
        );
      }

      // app was created by another user within an organization
      if (app.createdById !== user?.id && app.organizationId) {
        return (
          getOrg(app.organizationId)?.organization.name ||
          app.resourceOwner.slug
        );
      }

      return app.resourceOwner.slug;
    };

    return {
      createdByAuthedUser: app.createdById === user?.id,
      resourceOwnerType: app.resourceOwner.resourceOwnerType,
      resourceOwnerName: getResourceOwnerName(),
      resourceOwnerSlug: app.resourceOwner.slug,
    };
  };

  return { getAppOwner };
};
