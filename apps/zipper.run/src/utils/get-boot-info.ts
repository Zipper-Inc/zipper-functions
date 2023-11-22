import {
  BootInfo,
  BootInfoWithUserInfo,
  BootInfoWithUserResult,
} from '@zipper/types';
import {
  cacheBootPayload,
  cacheDeployment,
  DeploymentParams,
  formatDeploymentId,
  getZipperApiUrl,
  noop,
  parseDeploymentId,
  ZIPPER_TEMP_USER_ID_HEADER,
} from '@zipper/utils';
import { getBootUrl } from './get-relay-url';

type BootInfoParams = {
  subdomain: string;
  version?: string;
  tempUserId?: string;
  filename?: string;
  token?: string | null;
  deploymentId?: string;
};

const debug = () => process?.env?.__DEBUG__;

const buildHeaders = (token?: string | null, tempUserId?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };
  if (tempUserId) {
    headers[ZIPPER_TEMP_USER_ID_HEADER] = tempUserId;
  }
  return headers;
};

export async function fetchUserInfoFromBootInfo({
  subdomain,
  tempUserId,
  filename,
  token,
  bootInfo,
}: BootInfoParams & { bootInfo: BootInfo }): Promise<BootInfoWithUserResult> {
  return fetch(`${getZipperApiUrl()}/bootInfo/userInfo/${subdomain}`, {
    method: 'POST',
    body: JSON.stringify({ filename, appInfo: bootInfo.app }),
    headers: buildHeaders(token, tempUserId),
  })
    .then((r) => r.json())
    .then((r) => {
      if (r.ok) return { ok: true, data: { ...bootInfo, ...r.data } };
      return r;
    })
    .catch((e) => ({ ok: false, error: e.message, status: 500 }));
}

export async function fetchBootInfo({
  subdomain,
  tempUserId,
  filename,
  token,
}: BootInfoParams): Promise<BootInfoWithUserResult> {
  return fetch(`${getZipperApiUrl()}/bootInfo/${subdomain}`, {
    method: 'POST',
    body: JSON.stringify({ filename }),
    headers: buildHeaders(token, tempUserId),
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message, status: 500 }));
}

export async function fetchDeploymentCachedOrThrow(
  subdomain: string,
): Promise<DeploymentParams> {
  const cached = await cacheDeployment.get(subdomain).catch(noop);
  if (debug())
    console.log(
      `fetchDeploymentCachedOrThrow(${subdomain})`,
      '>',
      cached ? '✅ CACHE HIT' : '❌ CACHE MISSED',
      cached,
    );
  if (cached && cached.deploymentId) return cached;

  const result = await fetch(
    `${getZipperApiUrl()}/bootInfo/deployment/${subdomain}`,
  )
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message, status: 500 }));

  if (debug())
    console.log(
      `fetchDeploymentCachedOrThrow(${subdomain})`,
      '>',
      result.ok ? '✅ FETCH OK' : '❌ FETCH NOT OK',
      result,
    );
  if (!result.ok) {
    throw new Error(result.error || 'Error getting deployment', {
      cause: result,
    });
  }

  cacheDeployment.set(subdomain, result.data);
  return result.data;
}

export async function fetchBootPayloadCachedOrThrow({
  subdomain,
  tempUserId,
  filename,
  token,
  version: versionPassedIn,
  deploymentId: deploymentIdPassedIn,
}: BootInfoParams): Promise<Zipper.BootPayload & { bootInfo: BootInfo }> {
  if (debug())
    console.log('fetchBootPayloadCachedOrThrow()', '>', {
      subdomain,
      versionPassedIn,
      deploymentIdPassedIn,
    });
  const deployment = deploymentIdPassedIn
    ? parseDeploymentId(deploymentIdPassedIn)
    : await fetchDeploymentCachedOrThrow(subdomain);
  const version =
    versionPassedIn && versionPassedIn !== 'latest'
      ? versionPassedIn
      : deployment.version;
  const deploymentId = formatDeploymentId({ ...deployment, version });

  const cached = await cacheBootPayload.get({ deploymentId }).catch(noop);
  if (debug())
    console.log(
      `fetchBootPayloadCachedOrThrow(${deploymentId})`,
      '>',
      cached ? '✅ CACHE HIT' : '❌ CACHE MISSED',
      cached,
    );
  if (cached) return cached;

  const bootPayload: Zipper.BootPayload & { bootInfo: BootInfo } = await fetch(
    getBootUrl({ slug: subdomain, version }),
  ).then((r) => r.json());

  if (debug())
    console.log(
      `fetchBootPayloadCachedOrThrow(${deploymentId})`,
      '>',
      bootPayload.ok ? '✅ FETCH OK' : '❌ FETCH NOT OK',
      bootPayload,
    );
  if (!bootPayload.ok) {
    throw new Error('Error getting boot payload');
  }

  // Handle older applets with no bootInfo
  if (!bootPayload.bootInfo) {
    if (debug())
      console.log(
        `fetchBootPayloadCachedOrThrow(${deploymentId})`,
        '>',
        '👴🏽 Older version',
      );
    const result = await fetchBootInfo({
      subdomain,
      tempUserId,
      filename,
      token,
    });

    if (!result.ok) {
      throw new Error(result.error || 'Error getting boot info');
    }

    bootPayload.bootInfo = {
      ...result.data,
      app: { ...result.data.app, canUserEdit: undefined },
      userInfo: undefined,
      userAuthConnectors: undefined,
    };
  }

  await cacheBootPayload.set({ deploymentId }, bootPayload);
  return bootPayload;
}

export async function fetchBootPayloadCachedWithUserInfoOrThrow(
  params: BootInfoParams & { bootInfo?: BootInfo },
): Promise<Zipper.BootPayload & { bootInfo: BootInfoWithUserInfo }> {
  const bootPayload = await fetchBootPayloadCachedOrThrow(params);

  // This is the non-cachable part (user specific)
  const result = await fetchUserInfoFromBootInfo({
    ...params,
    bootInfo: params.bootInfo || bootPayload.bootInfo,
  });

  if (debug())
    console.log(
      `fetchUserInfoFromBootInfo(${params.deploymentId})`,
      '>',
      result.ok ? '✅ FETCH OK' : '❌ FETCH NOT OK',
      result,
    );
  if (!result.ok) {
    throw new Error(result.error || 'Error getting user boot info');
  }

  return {
    ...bootPayload,
    bootInfo: result.data,
  };
}

export async function fetchBootInfoCachedWithUserOrThrow(
  params: BootInfoParams & { bootInfo?: BootInfo },
): Promise<BootInfoWithUserInfo> {
  console.log('fetchBootInfoCachedWithUserOrThrow()', '>', params);
  return fetchBootPayloadCachedWithUserInfoOrThrow(params).then(
    (r) => r.bootInfo,
  );
}

export default fetchBootInfo;
