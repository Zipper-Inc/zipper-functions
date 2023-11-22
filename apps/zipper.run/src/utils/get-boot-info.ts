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
  ZIPPER_TEMP_USER_ID_HEADER,
} from '@zipper/utils';
import { getBootUrl } from './get-relay-url';

type BootInfoParams = {
  subdomain: string;
  version?: string;
  tempUserId?: string;
  filename?: string;
  token?: string | null;
};

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
  console.log('getting deployment from cache');
  const cached = await cacheDeployment.get(subdomain).catch();
  if (cached && cached.deploymentId) return cached;
  console.log('cache miss');

  const result = await fetch(
    `${getZipperApiUrl()}/bootInfo/deployment/${subdomain}`,
  )
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message, status: 500 }));

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
}: BootInfoParams): Promise<Zipper.BootPayload & { bootInfo: BootInfo }> {
  const deployment = await fetchDeploymentCachedOrThrow(subdomain);
  const version =
    versionPassedIn && versionPassedIn !== 'latest'
      ? versionPassedIn
      : deployment.version;
  const deploymentId = formatDeploymentId({ ...deployment, version });

  const cached = await cacheBootPayload.get({ deploymentId });
  if (cached) return cached;

  const bootPayload: Zipper.BootPayload & { bootInfo: BootInfo } = await fetch(
    getBootUrl({ slug: subdomain, version }),
  ).then((r) => r.json());

  if (!bootPayload.ok) {
    throw new Error('Error getting boot payload');
  }

  // Handle older applets with no bootInfo
  if (!bootPayload.bootInfo) {
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

  cacheBootPayload.set({ deploymentId }, bootPayload);
  return bootPayload;
}

export async function fetchBootPayloadCachedWithUserInfoOrThrow({
  subdomain,
  version,
  tempUserId,
  filename,
  token,
  bootInfo: bootInfoPassedIn,
}: BootInfoParams & { bootInfo?: BootInfo }): Promise<
  Zipper.BootPayload & { bootInfo: BootInfoWithUserInfo }
> {
  const payload = await fetchBootPayloadCachedOrThrow({
    subdomain,
    version,
    tempUserId,
    filename,
    token,
  });

  // This is the non-cachable part (user specific)
  const result = await fetchUserInfoFromBootInfo({
    subdomain,
    version,
    tempUserId,
    filename,
    token,
    bootInfo: bootInfoPassedIn || payload.bootInfo,
  });

  if (!result.ok) {
    throw new Error(result.error || 'Error getting user boot info');
  }

  return {
    ...payload,
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
