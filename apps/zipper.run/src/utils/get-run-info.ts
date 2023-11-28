import { RunInfoResult } from '@zipper/types';
import { getZipperApiUrl, X_ZIPPER_TEMP_USER_ID } from '@zipper/utils';

/**
 * App info endpoint url
 * @see /apps/zipper.dev/pages/api/appRun
 */
const APP_INFO_URL = `${getZipperApiUrl()}/appRun`;

export default async function getRunInfo({
  subdomain,
  token,
  runId,
  tempUserId,
}: {
  subdomain: string;
  token?: string | null;
  tempUserId?: string;
  runId: string;
}): Promise<RunInfoResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };
  if (tempUserId) {
    headers[X_ZIPPER_TEMP_USER_ID] = tempUserId;
  }
  return fetch(`${APP_INFO_URL}/${subdomain}/${runId}`, {
    method: 'POST',
    headers,
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message }));
}
