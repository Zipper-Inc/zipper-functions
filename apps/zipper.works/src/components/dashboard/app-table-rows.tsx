import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { Link, Tr, Td, Text, VStack, HStack } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { inferQueryOutput } from '~/utils/trpc';

type DashboardAppTableRowsProps = {
  apps: inferQueryOutput<'app.byAuthedUser'>;
  getAppOwner: (app: Unpack<inferQueryOutput<'app.byAuthedUser'>>) => string;
};

export const DashboardAppTableRows = ({
  apps,
  getAppOwner,
}: DashboardAppTableRowsProps) => {
  const router = useRouter();

  return (
    <>
      {apps?.map((app) => {
        const owner = getAppOwner(app);
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
