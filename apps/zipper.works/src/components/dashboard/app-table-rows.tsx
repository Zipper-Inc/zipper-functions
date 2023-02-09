import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { Link, Tr, Td, Text, VStack, HStack } from '@chakra-ui/react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import { OrganizationResource } from '@clerk/types';
import { inferQueryOutput } from '~/utils/trpc';

type DashboardAppTableRowsProps = {
  apps: inferQueryOutput<'app.byAuthedUser'>;
  organizations: Record<string, OrganizationResource>;
};

export const DashboardAppTableRows = ({
  apps,
  organizations,
}: DashboardAppTableRowsProps) => {
  const router = useRouter();
  const { user } = useUser();

  return (
    <>
      {apps?.map((app) => {
        const isOwner = app.createdById === user?.id;
        const owner = isOwner
          ? 'You'
          : organizations[app.organizationId ?? '']?.name;
        const lastUpdatedAt = new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'short',
        }).format(app.updatedAt || app.createdAt);

        return (
          <Tr key={app.id}>
            <Td>
              <VStack align={'start'} py="2">
                <HStack>
                  {app.isPrivate ? <LockIcon /> : <UnlockIcon />}
                  <Link
                    fontSize={'md'}
                    fontWeight={600}
                    onClick={() =>
                      router.push(
                        `/${app.resourceOwner.slug}/${app.slug}/edit/main.ts`,
                      )
                    }
                  >
                    {app.name || app.slug}
                  </Link>
                </HStack>
                <Text>{app.description}</Text>
              </VStack>
            </Td>
            <Td>{lastUpdatedAt}</Td>
            <Td>{owner}</Td>
          </Tr>
        );
      })}
    </>
  );
};
