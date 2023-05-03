import { AppInfoResult } from '@zipper/types';
import { ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';

/**
 * App info endpoint url
 * @see /apps/zipper.dev/pages/api/app/info
 */
const APP_INFO_URL = `${process.env.NEXT_PUBLIC_ZIPPER_API_URL}/app/info`;

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
  return fetch(`${APP_INFO_URL}/${subdomain}`, {
    method: 'POST',
    body: JSON.stringify({ filename }),
    headers,
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message }));
}
