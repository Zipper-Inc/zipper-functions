import {
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  ZIPPER_TEMP_USER_ID_HEADER,
} from '@zipper/utils';
import { GetServerSideProps } from 'next';
import { getInputValuesFromUrl } from '~/utils/get-input-values-from-url';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import type { AppPageProps } from '~/components/applet';
import getAppInfo from '~/utils/get-app-info';
import { getBootUrl, getRelayUrl } from '~/utils/get-relay-url';
import { getShortRunId } from '~/utils/run-id';
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

  const tempUserId = req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME];

  const { token } = await getZipperAuth(req);

  // grab the app if it exists
  const appInfoResult = await getAppInfo({
    subdomain,
    tempUserId,
    filename: (query['path'] as string | undefined) || 'main.ts',
    token: token || null,
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
  } = appInfoResult.data;

  const metadata = appInfoResult.data.metadata || {};

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

  if (tempUserId) {
    headers[ZIPPER_TEMP_USER_ID_HEADER] = tempUserId;
  }
  // boot it up
  // todo cache this
  const bootUrl = getBootUrl({ slug: appInfoResult.data.app.slug });
  const payload = await fetch(bootUrl, {
    headers,
  }).then((r) => r.text());

  if (payload === 'UNAUTHORIZED') return { props: { statusCode: 401 } };
  const { configs: handlerConfigs } = JSON.parse(payload) as Zipper.BootPayload;

  const result = await fetch(
    getRelayUrl({ slug: app.slug, path: query.path as string | undefined }),
    {
      method: 'POST',
      headers,
      body: JSON.stringify(inputs),
      credentials: 'include',
    },
  )
    .then((r) => {
      const runId = r.headers.get('x-zipper-run-id');
      if (runId) {
        metadata.runId = getShortRunId(runId);
      }
      return r.text();
    })
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
      handlerConfigs,
      token: req.headers['x-zipper-access-token'] || null,
    } as AppPageProps,
  };
};

export const config = {
  runtime: 'nodejs',
};
