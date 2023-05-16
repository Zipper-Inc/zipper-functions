import { getAuth } from '@clerk/nextjs/server';
import {
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
  ZIPPER_TEMP_USER_ID_HEADER,
} from '@zipper/utils';
import { GetServerSideProps } from 'next';
import { getInputValuesFromUrl } from '~/utils/get-input-values-from-url';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import type { AppPageProps } from '~/components/app';
import getAppInfo from '~/utils/get-app-info';
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
  const token = await auth.getToken({ template: 'incl_orgs' });
  const tempUserId = req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME];

  // grab the app if it exists
  const appInfoResult = await getAppInfo({
    subdomain,
    tempUserId,
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
    i.value = inputs[i.key];
    return i;
  });

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };

  if (tempUserId) {
    headers[ZIPPER_TEMP_USER_ID_HEADER] = tempUserId;
  }

  const getRunUrl = () => {
    const proto = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const slug = app.slug;
    const filename = query['path'] as string | undefined;
    return `${proto}://${slug}.${
      process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
    }/${filename || 'main'}/relay`;
  };

  const result = await fetch(getRunUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify(inputs),
    credentials: 'include',
  })
    .then((r) => {
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
    } as AppPageProps,
  };
};

export const config = {
  runtime: 'nodejs',
};
