import { useUser } from '@clerk/nextjs';
import { Gallery } from '~/components/gallery';
import { NextPageWithLayout } from './_app';
import { useRouter } from 'next/router';

const IndexPage: NextPageWithLayout = () => {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  if (user) {
    router.push('/dashboard');
  }

  if (isLoaded && !user) {
    return <Gallery />;
  }

  return <div></div>;
};

IndexPage.skipAuth = true;

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
