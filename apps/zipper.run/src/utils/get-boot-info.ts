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
  UNAUTHORIZED,
  X_ZIPPER_TEMP_USER_ID,
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

const debug = (...args: any[]) =>
  process?.env?.__DEBUG__ && console.log(...args);

const buildHeaders = (token?: string | null, tempUserId?: string) => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };
  if (tempUserId) {
    headers[X_ZIPPER_TEMP_USER_ID] = tempUserId;
  }
  return headers;
};

export async function fetchBasicUserInfo({
  subdomain,
  tempUserId,
  token,
}: BootInfoParams) {
  if (!token) return { ok: false, status: 401, error: UNAUTHORIZED };
  return fetch(`${getZipperApiUrl()}/bootInfo/basicUserInfo/${subdomain}`, {
    method: 'POST',
    headers: buildHeaders(token, tempUserId),
    credentials: 'include',
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message, status: 500 }));
}

export async function fetchExtendedUserInfo({
  subdomain,
  tempUserId,
  filename,
  token,
  bootInfo,
}: BootInfoParams & { bootInfo: BootInfo }): Promise<BootInfoWithUserResult> {
  if (bootInfo.app.requiresAuthToRun && !token)
    return { ok: false, status: 401, error: UNAUTHORIZED };

  return fetch(`${getZipperApiUrl()}/bootInfo/extendedUserInfo/${subdomain}`, {
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

/**
 * Gets minimum amount of information we need from a subdomain to run an applet
 *
 * @note This doesn't check auth at all so it's cachable
 * @todo Maybe it should be secure?
 */
export async function fetchDeploymentCachedOrThrow(
  subdomain: string,
): Promise<DeploymentParams> {
  const cached = await cacheDeployment.get(subdomain).catch(noop);

  debug(
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

  debug(
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
  debug('fetchBootPayloadCachedOrThrow()', '>', {
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

  debug(
    `fetchBootPayloadCachedOrThrow(${deploymentId})`,
    '>',
    cached ? '✅ cache HIT' : '❌ cache MISSED',
    cached,
  );

  if (cached) return cached;

  const bootPayload: Zipper.BootPayload & { bootInfo: BootInfo } = await fetch(
    getBootUrl({ slug: subdomain, version }),
  ).then((r) => r.json());

  debug(
    `fetchBootPayloadCachedOrThrow(${deploymentId})`,
    '>',
    bootPayload.ok ? '✅ fetch OK' : '❌ fetch NOT OK',
    bootPayload,
  );

  if (!bootPayload.ok) {
    throw new Error('Error getting boot payload');
  }

  // Handle older applets with no bootInfo
  if (!bootPayload.bootInfo) {
    debug(
      `fetchBootPayloadCachedOrThrow(${deploymentId})`,
      '>',
      '📼 Legacy version',
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
  const result = await fetchExtendedUserInfo({
    ...params,
    bootInfo: params.bootInfo || bootPayload.bootInfo,
  });

  debug(
    `fetchUserInfoFromBootInfo(${params.deploymentId})`,
    '>',
    result.ok ? '✅ fetch OK' : '❌ fetch NOT OK',
    result,
  );

  if (!result.ok) {
    throw new Error(result.error || 'UNKNOWN_ERROR');
  }

  return {
    ...bootPayload,
    bootInfo: result.data,
  };
}

export async function fetchBootInfoCachedWithUserOrThrow(
  params: BootInfoParams & { bootInfo?: BootInfo },
): Promise<BootInfoWithUserInfo> {
  return fetchBootPayloadCachedWithUserInfoOrThrow(params).then(
    (r) => r.bootInfo,
  );
}

export default fetchBootInfo;
