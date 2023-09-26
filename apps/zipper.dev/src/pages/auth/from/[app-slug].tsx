import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Header from '~/components/header';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const AuthorizePage: NextPageWithLayout = () => {
  const router = useRouter();
  const slug = router.query['app-slug'] as string;
  const generateCodeMutation = trpc.user.addZipperAuthCode.useMutation({
    onSuccess: (code) => {
      router.push(
        `${
          process.env.NODE_ENV === 'production' ? 'https' : 'http'
        }://${slug}.${
          process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST
        }/auth?code=${code}`,
      );
    },
  });

  useEffect(() => {
    generateCodeMutation.mutateAsync();
  }, []);

  return <></>;
};

AuthorizePage.header = () => <Header showNav={false}></Header>;

export default AuthorizePage;
