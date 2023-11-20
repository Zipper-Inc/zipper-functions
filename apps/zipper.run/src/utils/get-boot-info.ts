import { BootInfo, BootInfoWithUserResult } from '@zipper/types';
import { getZipperApiUrl, ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';

type BootInfoParams = {
  subdomain: string;
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

export default fetchBootInfo;
