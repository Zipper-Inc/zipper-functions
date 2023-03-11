import { AppInfoResult } from '@zipper/types';

/**
 * App info endpoint url
 * @see /apps/zipper.works/pages/api/app/info
 */
const APP_INFO_URL = `${process.env.ZIPPER_API_URL}/app/info`;

export default async function getAppInfo(
  subdomain: string,
  userId?: string,
): Promise<AppInfoResult> {
  return fetch(`${APP_INFO_URL}/${subdomain}`, {
    method: 'POST',
    body: JSON.stringify({ userId }),
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.toString() }));
}
