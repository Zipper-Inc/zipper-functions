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

  const secureAttribute =
    process.env.NODE_ENV === 'production' ? '; Secure' : '';

  res.setHeader('set-cookie', [
    `__zipper_token=${json.accessToken}; HttpOnly; SameSite=Lax${secureAttribute}`,
    `__zipper_refresh=${json.refreshToken}; HttpOnly; SameSite=Lax${secureAttribute}`,
  ]);

  return {
    redirect: {
      destination: `/`,
      permanent: false,
    },
  };
};

export default AuthPage;
