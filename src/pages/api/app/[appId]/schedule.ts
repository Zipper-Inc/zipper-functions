import type { NextApiRequest, NextApiResponse } from 'next';
import { queues } from '~/server/queue';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const job = await queues.schedule.add('myJobName', { foo: 'bar' });
  res.send(job.toJSON());
}
