import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import rateLimit from '~/utils/ratelimit';

const limiter = rateLimit({
  interval: 5000,
  uniqueTokenPerInterval: 500, // Max 500 users per second
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { appId, deploymentId, inputs, success, result } = req.body;
  limiter
    .check(res, 5, appId)
    .then(async () => {
      try {
        await prisma.appRun.create({
          data: {
            appId,
            deploymentId,
            inputs,
            success,
            result,
          },
        });

        res.status(200).send('OK');
      } catch (error) {
        res.status(500).send(error || 'Something went wrong');
      }
    })
    .catch(() => {
      res.status(429).send('Too many requests');
    });
}
