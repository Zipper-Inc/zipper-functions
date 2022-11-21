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
import NextError from 'next/error';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { HiArrowRight } from 'react-icons/hi';
import { SessionContextUpdate } from 'supertokens-auth-react/lib/build/recipe/session/types';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';
import DefaultGrid from '~/components/default-grid';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const AppPage: NextPageWithLayout = () => {
  const router = useRouter();
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);
  const forksQuery = trpc.useQuery(['app.byAuthedUser', { parentId: id }]);

  const session = useSessionContext() as SessionContextUpdate & {
    loading: boolean;
  };

  const [isUserAnAppEditor, setIsUserAnAppEditor] = useState(false);

  useEffect(() => {
    setIsUserAnAppEditor(
      !!appQuery.data?.editors.find(
        (editor) => editor.user.superTokenId === session.userId,
      ) || false,
    );
  }, [appQuery.isSuccess]);

  const forkApp = trpc.useMutation('app.fork', {
    async onSuccess(data) {
      router.push(`/app/${data.id}/edit`);
    },
  });

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (appQuery.status !== 'success') {
    return <></>;
  }

  if (appQuery.data.isPrivate) {
    if (!isUserAnAppEditor) {
      return <NextError statusCode={404} />;
    }
  }

  const { data } = appQuery;
  return (
    <DefaultGrid>
      <GridItem colSpan={5}>
        <VStack gap={4} alignItems="start" w={560}>
          <Heading as="h1" size="2xl" fontWeight="bold" overflowWrap="normal">
            {data.name}
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
                                  router.push(`/app/${fork.id}/edit`)
                                }
                              >
                                {fork.name}
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
                  if (session?.userId) {
                    forkApp.mutateAsync({ id });
                  } else {
                    router.push(
                      `/auth?redirectToPath=${window.location.pathname}`,
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
                  router.push(`/app/${id}/edit/main.ts`);
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
