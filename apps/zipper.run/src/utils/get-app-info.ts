import { AppInfoResult } from '@zipper/types';

/**
 * App info endpoint url
 * @see /apps/zipper.works/pages/api/app/info
 */
const APP_INFO_URL = `${process.env.ZIPPER_API_URL}/app/info`;

export default async function getAppInfo({
  subdomain,
  userId,
  filename,
  token,
}: {
  subdomain: string;
  userId?: string;
  filename?: string;
  token?: string | null;
}): Promise<AppInfoResult> {
  return fetch(`${APP_INFO_URL}/${subdomain}`, {
    method: 'POST',
    body: JSON.stringify({ userId, filename }),
    headers: {
      Authorization: `Bearer ${token || ''}`,
    },
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message }));
}
