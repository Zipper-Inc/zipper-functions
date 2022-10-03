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
  Heading,
  HStack,
  Input,
  Link,
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
      <Header />
      <Box marginX="8">
        <Heading as="h1" size="2xl" marginBottom={4}>
          Welcome to Zipper Functions!
        </Heading>

        <Heading size="lg" marginBottom={4}>
          Apps
          {appQuery.status === 'loading' && '(loading)'}
        </Heading>

        {appQuery.data?.map((app) => (
          <Box as="article" key={app.id} marginY="4">
            <Heading as="h3" size="md">
              {app.name}
            </Heading>
            <NextLink href={`/platformOrganization/${app.id}`}>
              <Link textColor="brandPurple">View more</Link>
            </NextLink>
          </Box>
        ))}

        <hr />

        <form
          onSubmit={handleSubmit(({ name }) => {
            addApp.mutateAsync({ name });
          })}
        >
          <Flex marginTop="4">
            {addApp.error && (
              <FormErrorMessage>{addApp.error.message}</FormErrorMessage>
            )}
            <HStack>
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
            </HStack>
          </Flex>
        </form>
      </Box>
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
