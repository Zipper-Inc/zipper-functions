import {
  Button,
  GridItem,
  Heading,
  HStack,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useUser } from '@clerk/nextjs';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import { HiArrowRight } from 'react-icons/hi';
import DefaultGrid from '~/components/default-grid';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const AppPage: NextPageWithLayout = () => {
  const router = useRouter();

  const resourceOwnerSlug = router.query['resource-owner'] as string;
  const appSlug = router.query['app-slug'] as string;
  const { user } = useUser();

  const appQuery = trpc.useQuery([
    'app.byResourceOwnerAndAppSlugs',
    { resourceOwnerSlug, appSlug },
  ]);

  const forksQuery = trpc.useQuery(
    ['app.byAuthedUser', { parentId: appQuery.data?.id }],
    { enabled: !!appQuery.data },
  );

  const forkApp = trpc.useMutation('app.fork', {
    async onSuccess(data) {
      router.push(`/${user?.publicMetadata.username}/${data.slug}/edit`);
    },
  });

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 404}
      />
    );
  }

  if (appQuery.isLoading || !appQuery.data) {
    return <></>;
  }

  const { data } = appQuery;
  return (
    <DefaultGrid>
      <GridItem colSpan={5}>
        <VStack gap={4} alignItems="start" w={560}>
          <Heading as="h1" size="2xl" fontWeight="bold" overflowWrap="normal">
            {data.name || data.slug}
          </Heading>

          <Text fontWeight={500} color="gray.500">
            About this app
          </Text>

          <VStack spacing={4} align={'start'}>
            <Text fontSize="lg">{data.description}</Text>
            {forksQuery.data && forksQuery.data.length > 0 && (
              <>
                <Text fontWeight={500} color="gray.500">
                  Your forks
                </Text>
                <TableContainer
                  border="1px solid"
                  borderRadius={10}
                  borderColor="gray.100"
                >
                  <Table>
                    <Tbody>
                      {forksQuery.data.map((fork) => (
                        <Tr key={fork.id}>
                          <Td>
                            <HStack>
                              <HiArrowRight />
                              <Link
                                onClick={() =>
                                  router.push(
                                    `/${fork.resourceOwner?.slug}/${fork.slug}/edit`,
                                  )
                                }
                              >
                                {fork.name || fork.slug}
                              </Link>
                            </HStack>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableContainer>
              </>
            )}

            <HStack pt={10}>
              <Button
                type="button"
                paddingX={6}
                bgColor="purple.800"
                textColor="gray.100"
                onClick={() => {
                  if (user) {
                    forkApp.mutateAsync({ id: appQuery.data.id });
                  } else {
                    router.push(
                      `/sign-in?redirect=${window.location.pathname}`,
                    );
                  }
                }}
              >
                Fork
              </Button>

              <Button
                type="button"
                paddingX={6}
                bgColor="purple.800"
                textColor="gray.100"
                onClick={() => {
                  router.push(
                    `/${resourceOwnerSlug}/${appSlug}/edit/${
                      appQuery.data.scriptMain?.script.filename || 'main.ts'
                    }`,
                  );
                }}
              >
                View
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </GridItem>
    </DefaultGrid>
  );
};

AppPage.skipAuth = true;

export default AppPage;
