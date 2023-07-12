import { AppInfoResult } from '@zipper/types';
import { getZipperApiUrl, ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';

export default async function getAppInfo({
  subdomain,
  tempUserId,
  filename,
  token,
}: {
  subdomain: string;
  tempUserId?: string;
  filename?: string;
  token?: string | null;
}): Promise<AppInfoResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };
  if (tempUserId) {
    headers[ZIPPER_TEMP_USER_ID_HEADER] = tempUserId;
  }
  return fetch(`${getZipperApiUrl()}/app/info/${subdomain}`, {
    method: 'POST',
    body: JSON.stringify({ filename }),
    headers,
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message }));
}
