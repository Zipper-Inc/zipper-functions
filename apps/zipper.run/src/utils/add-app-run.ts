import { AddAppRun } from '@zipper/types';

/**
 * Add app run via API endpoint
 * @see /apps/zipper.works/pages/api/appRun/create
 */
export default async function addAppRun(params: AddAppRun): Promise<Response> {
  const url = `${process.env.ZIPPER_API_URL}/appRun/create`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
}
