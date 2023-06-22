import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { GetServerSideProps } from 'next';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';
import { getInputValuesFromAppRun } from '~/utils/get-input-values-from-url';
import getRunInfo from '~/utils/get-run-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import type { AppPageProps } from '~/components/applet';
import { getZipperAuth } from '~/utils/get-zipper-auth';
export { default } from '~/components/applet';

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return { notFound: true };

  const { token, userId } = await getZipperAuth(req);

  // grab the app if it exists
  const result = await getRunInfo({
    subdomain,
    token,
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

  console.log(appRun);

  const defaultValues = getInputValuesFromAppRun(inputs, appRun.inputs);

  const { githubAuthUrl, slackAuthUrl } = getConnectorsAuthUrl({
    appId: app.id,
    userAuthConnectors,
    userId: userId || (req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME] as string),
    host: req.headers.host,
  });

  const proto = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const runUrl = `${proto}://${host}${req.url}`;

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
      token: req.headers['x-zipper-access-token'] || null,
      runUrl,
    } as AppPageProps,
  };
};
