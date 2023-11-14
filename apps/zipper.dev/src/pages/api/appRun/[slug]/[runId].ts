import { RunInfoResult } from '@zipper/types';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { getBootInfoWithUserFromRequest } from '../../bootInfo/[slug]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const runIdFromUrl = req.query.runId as string;
  if (runIdFromUrl.length < 8) {
    return res.status(500).send({ ok: false, error: 'Invalid run id' });
  }

  const bootInfo = await getBootInfoWithUserFromRequest(req, res);
  if (!bootInfo)
    return res.status(500).send({ ok: false, error: 'Invalid boot info' });

  const slug = bootInfo.app.slug;

  let appRun;
  try {
    appRun = await prisma.appRun.findFirst({
      where: {
        id: { startsWith: runIdFromUrl },
        app: { slug },
      },
    });
  } catch (e: any) {
    return res.status(500).send({ ok: false, error: e.toString() });
  }

  if (!appRun) {
    return res.status(404).send({
      ok: false,
      error: `There are no apps with slug: ${slug}`,
    });
  }

  let result: any = appRun.result;

  if (
    bootInfo.userInfo.userId &&
    bootInfo.app.requiresAuthToRun &&
    appRun.userId !== bootInfo.userInfo.userId
  ) {
    result = "You're not authorized to view this run. Try re-running the app.";
  }

  const runInfoResult: RunInfoResult = {
    ok: true,
    data: {
      appRun: {
        path: appRun.path,
        version: appRun.version || 'latest',
        result,
        inputs: appRun.inputs as Record<string, string>,
      },
      ...bootInfo,
    },
  };

  return res.status(200).send(runInfoResult);
}
