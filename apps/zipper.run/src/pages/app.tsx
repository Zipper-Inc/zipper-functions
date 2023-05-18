import { getAuth } from '@clerk/nextjs/server';
import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { GetServerSideProps } from 'next';
import getAppInfo from '~/utils/get-app-info';
import { getConnectorsAuthUrl } from '~/utils/get-connectors-auth-url';
import { getInputValuesFromUrl } from '~/utils/get-input-values-from-url';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getFilenameAndVersionFromPath } from '~/utils/get-values-from-url';

export { default } from '~/components/app';

const { __DEBUG__ } = process.env;

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  if (__DEBUG__) console.log('getValidSubdomain', { subdomain, host });
  if (!subdomain) return { notFound: true };

  const { version: versionFromUrl, filename } = getFilenameAndVersionFromPath(
    ((query.versionAndFilename as string[]) || []).join('/'),
    [],
  );
  if (__DEBUG__) console.log({ versionFromUrl, filename });

  const auth = getAuth(req);

  // grab the app if it exists
  const result = await getAppInfo({
    subdomain,
    tempUserId: req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
    filename,
    token: await auth.getToken({ template: 'incl_orgs' }),
  });

  if (__DEBUG__) console.log('getAppInfo', { result });
  if (!result.ok) {
    if (result.error === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const {
    app,
    inputs,
    userAuthConnectors,
    entryPoint,
    runnableScripts,
    metadata,
  } = result.data;

  const version = versionFromUrl || 'latest';

  const defaultValues = getInputValuesFromUrl(inputs, req.url);
  if (__DEBUG__) console.log({ defaultValues });

  const propsToReturn = {
    props: {
      app,
      inputs,
      version,
      defaultValues,
      userAuthConnectors,
      entryPoint,
      runnableScripts,
      metadata,
      filename: filename || 'main.ts',
    },
  };

  const { githubAuthUrl, slackAuthUrl } = getConnectorsAuthUrl({
    userAuthConnectors,
    userId:
      auth.userId || (req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME] as string),
    appId: app.id,
    host: req.headers.host,
  });

  return {
    props: { ...propsToReturn.props, slackAuthUrl, githubAuthUrl },
  };
};
