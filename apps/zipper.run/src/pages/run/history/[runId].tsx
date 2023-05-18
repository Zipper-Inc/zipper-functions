import { getAuth } from '@clerk/nextjs/server';
import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { GetServerSideProps } from 'next';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';
import { getInputValuesFromAppRun } from '~/utils/get-input-values-from-url';
import getRunInfo from '~/utils/get-run-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import type { AppPageProps } from '~/components/applet';
export { default } from '~/components/applet';

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
    tempUserId: req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
  });

  if (!result.ok) {
    if (result.error === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const {
    appRun,
    app,
    inputs,
    userAuthConnectors,
    entryPoint,
    runnableScripts,
  } = result.data;

  const defaultValues = getInputValuesFromAppRun(inputs, appRun.inputs);

  const { githubAuthUrl, slackAuthUrl } = getConnectorsAuthUrl({
    appId: app.id,
    userAuthConnectors,
    userId:
      auth.userId || (req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME] as string),
    host: req.headers.host,
  });

  return {
    props: {
      app,
      inputs,
      version: appRun.version,
      defaultValues,
      userAuthConnectors,
      entryPoint,
      filename: appRun.path,
      result: appRun.result,
      hideRun: true,
      runnableScripts,
      githubAuthUrl,
      slackAuthUrl,
    } as AppPageProps,
  };
};
