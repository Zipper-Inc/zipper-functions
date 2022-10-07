import {
  Button,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import React from 'react';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const AppPage: NextPageWithLayout = () => {
  const router = useRouter();
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);

  const forkApp = trpc.useMutation('app.fork', {
    async onSuccess(data) {
      router.push(`/app/${data.id}`);
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
    return <>Loading...</>;
  }
  const { data } = appQuery;
  return (
    <HStack pl="100px" pt="100px">
      <SimpleGrid columns={3}>
        <VStack gap={4} alignItems="start" w={560}>
          <Heading as="h1" size="xl" overflowWrap={'normal'}>
            {data.name}
          </Heading>

          <Text fontWeight={500} fontSize="lg">
            About this app
          </Text>

          <VStack spacing={4} align={'start'}>
            <Text fontSize="lg">{data.description}</Text>
            <HStack pt={10}>
              <Button
                type="button"
                paddingX={6}
                bgColor="purple.800"
                textColor="gray.100"
                onClick={() => {
                  forkApp.mutateAsync({ id });
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
                  router.push(`/app/${id}/edit`);
                }}
              >
                Edit
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </SimpleGrid>
    </HStack>
  );
};

export default AppPage;
