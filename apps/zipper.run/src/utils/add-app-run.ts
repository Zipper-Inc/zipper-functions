import { AddAppRun } from '@zipper/types';
import { getZipperApiUrl } from '@zipper/utils';

/**
 * Add app run via API endpoint
 * @see /apps/zipper.dev/pages/api/appRun/create
 */
export default async function addAppRun(params: AddAppRun): Promise<Response> {
  const url = `${getZipperApiUrl()}/appRun/create`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
}
