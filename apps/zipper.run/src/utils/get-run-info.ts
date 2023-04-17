import { RunInfoResult } from '@zipper/types';

/**
 * App info endpoint url
 * @see /apps/zipper.works/pages/api/app/info
 */
const APP_INFO_URL = `${process.env.ZIPPER_API_URL}/appRun`;

export default async function getRunInfo({
  subdomain,
  token,
  runId,
}: {
  subdomain: string;
  token?: string | null;
  runId: string;
}): Promise<RunInfoResult> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };
  return fetch(`${APP_INFO_URL}/${subdomain}/${runId}`, {
    method: 'POST',
    headers,
  })
    .then((r) => r.json())
    .catch((e) => ({ ok: false, error: e.message }));
}
