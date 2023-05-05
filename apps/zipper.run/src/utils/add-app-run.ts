import { AddAppRun } from '@zipper/types';

/**
 * Add app run via API endpoint
 * @see /apps/zipper.dev/pages/api/appRun/create
 */
export default async function addAppRun(params: AddAppRun): Promise<Response> {
  const url = `${process.env.NEXT_PUBLIC_ZIPPER_API_URL}/appRun/create`;
  return fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
}
