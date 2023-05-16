import { getAuth } from '@clerk/nextjs/server';
import {
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  ZIPPER_TEMP_USER_ID_HEADER,
} from '@zipper/utils';
import { GetServerSideProps } from 'next';
import { getInputValuesFromUrl } from '~/utils/get-input-values-from-url';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import type { AppPageProps } from '~/components/applet';
import getAppInfo from '~/utils/get-app-info';
import { getRelayUrl } from '~/utils/get-relay-url';
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
  const token = await auth.getToken({ template: 'incl_orgs' });

  // grab the app if it exists
  const appInfoResult = await getAppInfo({
    subdomain,
    tempUserId: req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
    filename: (query['path'] as string | undefined) || 'main.ts',
    token,
  });

  if (!appInfoResult.ok) {
    if (appInfoResult.error === 'UNAUTHORIZED')
      return { props: { statusCode: 401 } };
    return { notFound: true };
  }

  const {
    app,
    inputs: inputParams,
    userAuthConnectors,
    entryPoint,
    runnableScripts,
    metadata,
  } = appInfoResult.data;

  const urlInputs = getInputValuesFromUrl(inputParams, req.url);

  const inputs: Record<string, any> = {};

  Object.keys(urlInputs).map((k) => {
    const inputName = k.split(':')[0];
    if (inputName) {
      inputs[inputName] = urlInputs[k];
    }
  });

  const inputParamsWithValues = inputParams.map((i) => {
    if (inputs[i.key]) i.value = inputs[i.key];
    return i;
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };

  const tempUserId = req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME];

  if (tempUserId) {
    headers[ZIPPER_TEMP_USER_ID_HEADER] = tempUserId;
  }

  const result = await fetch(
    getRelayUrl({ slug: app.slug, path: query.path as string | undefined }),
    {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
      credentials: 'include',
    },
  )
    .then((r) => r.text())
    .catch((e) => {
      console.log(e);
      return { ok: false, error: e.message };
    });

  return {
    props: {
      app,
      inputs: inputParamsWithValues,
      version: 'latest',
      userAuthConnectors,
      entryPoint,
      filename: query['path'],
      result,
      hideRun: true,
      runnableScripts,
      metadata,
    } as AppPageProps,
  };
};
