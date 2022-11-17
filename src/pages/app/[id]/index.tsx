import {
  Button,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import React from 'react';
import DefaultGrid from '~/components/default-grid';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const AppPage: NextPageWithLayout = () => {
  const router = useRouter();
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);

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
  const { data } = appQuery;
  return (
    <DefaultGrid>
      <GridItem colSpan={5}>
        <VStack gap={4} alignItems="start" w={560}>
          <Heading as="h1" size="2xl" fontWeight="bold" overflowWrap="normal">
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
                  router.push(`/app/${id}/edit/main.ts`);
                }}
              >
                Edit
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
