import { getZipperApiUrl } from '@zipper/utils';
import { GetServerSideProps } from 'next';

export const AuthPage = () => {
  return <></>;
};

export const getServerSideProps: GetServerSideProps = async ({
  query,
  res,
}) => {
  const result = await fetch(`${getZipperApiUrl()}/auth/getToken`, {
    method: 'POST',
    body: JSON.stringify({ code: query.code }),
  });

  const json = await result.json();

  res.setHeader('set-cookie', [
    `__zipper_token=${json.accessToken};`,
    `__zipper_refresh=${json.refreshToken};`,
  ]);

  return {
    redirect: {
      destination: `/`,
      permanent: false,
    },
  };
};

export default AuthPage;
