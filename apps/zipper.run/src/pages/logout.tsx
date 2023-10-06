import { deleteCookie } from 'cookies-next';
import type { GetServerSidePropsContext } from 'next';

export function getServerSideProps({ res, req }: GetServerSidePropsContext) {
  deleteCookie('__zipper_token', { req, res });
  deleteCookie('__zipper_refresh', { req, res });
  return {
    redirect: {
      destination: '/',
      permanent: false,
    },
  };
}

export default function Page() {
  return <></>;
}
