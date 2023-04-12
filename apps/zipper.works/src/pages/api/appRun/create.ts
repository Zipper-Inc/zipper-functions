import { AddAppRun } from '@zipper/types';
import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { appId, deploymentId, scheduleId, rpcBody, success, result } =
    req.body as AddAppRun;

  try {
    const appRun = await prisma.appRun.create({
      data: {
        appId,
        deploymentId,
        scheduleId,
        inputs: rpcBody.inputs,
        path: rpcBody.path,
        originalRequestUrl: rpcBody.originalRequest.url,
        originalRequestMethod: rpcBody.originalRequest.method,
        version: rpcBody.appInfo.version,
        success,
        result,
      },
    });

    res.status(200).send(appRun.id);
  } catch (error) {
    res.status(500).send(error || 'Something went wrong');
  }
}
