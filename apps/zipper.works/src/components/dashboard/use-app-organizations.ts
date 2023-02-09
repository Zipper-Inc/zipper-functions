import { useOrganizations } from '@clerk/nextjs';
import { OrganizationResource } from '@clerk/types';
import { useState, useEffect } from 'react';
import { inferQueryOutput } from '~/utils/trpc';

export const useAppOrganizations = (
  apps: inferQueryOutput<'app.byAuthedUser'> | undefined,
) => {
  const { getOrganization } = useOrganizations();
  const [organizations, setOrganizations] = useState<
    Record<string, OrganizationResource>
  >({});

  useEffect(() => {
    if (typeof getOrganization === 'function') {
      const orgIds = (apps ?? []).reduce((ids, { organizationId }) => {
        if (organizationId && !ids.includes(organizationId)) {
          return ids.concat(organizationId);
        }
        return ids;
      }, [] as string[]);

      Promise.all(orgIds.map(async (id) => getOrganization(id))).then(
        (data) => {
          const orgs = data.reduce((orgs, cur) => {
            if (cur) {
              return { ...orgs, [cur.id]: cur };
            }
            return orgs;
          }, {} as typeof organizations);
          setOrganizations(orgs);
        },
      );
    }
  }, [getOrganization, apps]);

  return organizations;
};
