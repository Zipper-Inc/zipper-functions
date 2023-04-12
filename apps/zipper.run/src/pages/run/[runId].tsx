import { getAuth } from '@clerk/nextjs/server';
import { GetServerSideProps } from 'next';
import getRunInfo from '~/utils/get-run-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';

export { default } from '~/components/app';

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return { notFound: true };

  const auth = getAuth(req);

  // grab the app if it exists
  const result = await getRunInfo({
    subdomain,
    token: await auth.getToken({ template: 'incl_orgs' }),
    runId: query.runId as string,
  });

  if (!result.ok) {
    if (result.error === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const { appRun, app, inputs, userAuthConnectors, editUrl } = result.data;

  return {
    props: {
      app,
      inputs,
      version: appRun.version,
      defaultValues: inputs,
      userAuthConnectors,
      editUrl,
      filename: appRun.path,
      result: appRun.result,
      hideRun: true,
    },
  };
};
