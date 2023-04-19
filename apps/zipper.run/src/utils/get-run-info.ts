import { RunInfoResult } from '@zipper/types';
import { ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';

/**
 * App info endpoint url
 * @see /apps/zipper.works/pages/api/app/info
 */
const APP_INFO_URL = `${process.env.ZIPPER_API_URL}/appRun`;

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
    headers[ZIPPER_TEMP_USER_ID_HEADER] = tempUserId;
  }
  return fetch(`${APP_INFO_URL}/${subdomain}/${runId}`, {
    method: 'POST',
    headers,
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message }));
}
