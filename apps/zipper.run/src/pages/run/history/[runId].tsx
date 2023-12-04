import {
  UNAUTHORIZED,
  X_ZIPPER_ACCESS_TOKEN,
  __ZIPPER_TEMP_USER_ID,
} from '@zipper/utils';
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
  const { resultOnly } = query;
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
    tempUserId: req.cookies[__ZIPPER_TEMP_USER_ID],
  });

  if (!result.ok) {
    if (result.error === UNAUTHORIZED) return { props: { statusCode: 401 } };
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
    userId: userId || (req.cookies[__ZIPPER_TEMP_USER_ID] as string),
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
      metadata: {
        runId: query.runId as string,
      },
      runnableScripts,
      githubAuthUrl,
      slackAuthUrl,
      token: req.headers[X_ZIPPER_ACCESS_TOKEN] || null,
      runUrl,
      resultOnly: !!resultOnly,
    } as AppPageProps,
  };
};
