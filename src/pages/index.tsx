import { trpc } from '../utils/trpc';
import { NextPageWithLayout } from './_app';
import NextLink from 'next/link';
import Header from '../components/header';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Link,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import React from 'react';

const IndexPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const appQuery = trpc.useQuery(['app.all']);
  const addApp = trpc.useMutation('app.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.all']);
    },
  });
  const { register, handleSubmit } = useForm();

  // prefetch all posts for instant navigation
  // useEffect(() => {
  //   for (const { id } of postsQuery.data ?? []) {
  //     utils.prefetchQuery(['post.byId', { id }]);
  //   }
  // }, [postsQuery.data, utils]);

  return (
    <>
      <HStack alignItems="start">
        <VStack alignItems="start" spacing={2} w={280}>
          <Link href="#">Popular Apps</Link>
          <Link href="#">AI Magic</Link>
          <Link href="#">Note Taking</Link>
        </VStack>
        <Grid templateColumns="repeat(3, 280px)" gridGap={10}>
          {appQuery.data?.map((app, index) => {
            if (index === 0) {
              return (
                <GridItem
                  colSpan={3}
                  key={app.id}
                  background="gray.100"
                  borderRadius={10}
                  p={4}
                  height="240"
                >
                  <Heading as="h3" size="md">
                    {app.name}
                  </Heading>
                  <NextLink href={`/app/${app.id}`}>
                    <Link textColor="brandPurple">View more</Link>
                  </NextLink>
                </GridItem>
              );
            }

            return (
              <GridItem
                key={app.id}
                height={240}
                background="gray.100"
                borderRadius={10}
                p={4}
              >
                <Heading as="h3" size="md">
                  {app.name}
                </Heading>
                <NextLink href={`/app/${app.id}`}>
                  <Link textColor="brandPurple">View more</Link>
                </NextLink>
              </GridItem>
            );
          })}
          <GridItem>
            <form
              onSubmit={handleSubmit(({ name }) => {
                addApp.mutateAsync({ name });
              })}
            >
              <Flex marginTop="4" direction="column">
                {addApp.error && (
                  <FormErrorMessage>{addApp.error.message}</FormErrorMessage>
                )}
                <VStack alignItems="start">
                  <Heading size="md">Create App</Heading>
                  <FormControl as={React.Fragment}>
                    <FormLabel>Name:</FormLabel>
                    <Input
                      size="md"
                      type="text"
                      disabled={addApp.isLoading}
                      {...register('name')}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    paddingX={6}
                    disabled={addApp.isLoading}
                    bgColor="purple.800"
                    textColor="gray.100"
                  >
                    Submit
                  </Button>
                </VStack>
              </Flex>
            </form>
          </GridItem>
        </Grid>
      </HStack>
    </>
  );
};

export default IndexPage;

/**
 * If you want to statically render this page
 * - Export `appRouter` & `createContext` from [trpc].ts
 * - Make the `opts` object optional on `createContext()`
 *
 * @link https://trpc.io/docs/ssg
 */
// export const getStaticProps = async (
//   context: GetStaticPropsContext<{ filter: string }>,
// ) => {
//   const ssg = createSSGHelpers({
//     router: appRouter,
//     ctx: await createContext(),
//   });
//
//   await ssg.fetchQuery('post.all');
//
//   return {
//     props: {
//       trpcState: ssg.dehydrate(),
//       filter: context.params?.filter ?? 'all',
//     },
//     revalidate: 1,
//   };
// };
