import { App, Script, ScriptMain } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { AppInfoResult } from '@zipper/types';
import { parseInputForTypes } from '~/utils/parse-input-for-types';

/**
 * @todo
 * - security of some sort (control access for users)
 * - restrict endpoint to run server or something
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slugFromUrl = req.query.slug as string;

  let appFound:
    | (App & {
        scriptMain: ScriptMain | null;
        scripts: Script[];
      })
    | null;

  try {
    appFound = await prisma.app.findUnique({
      where: { slug: slugFromUrl },
      include: { scripts: true, scriptMain: true },
    });
  } catch (e: any) {
    return res.status(500).send({ ok: false, error: e.toString() });
  }

  if (!appFound) {
    return res.status(404).send({
      ok: false,
      error: `There are no apps with slug: ${slugFromUrl}`,
    });
  }

  const {
    id,
    name,
    slug,
    description,
    lastDeploymentVersion,
    scriptMain,
    scripts,
  } = appFound;

  const mainScript = scripts.find(
    (script) => script.id === scriptMain?.scriptId,
  );

  if (!mainScript || !mainScript.code) {
    return res.status(500).send({
      ok: false,
      error: `Can't get inputs for app: ${slug} is missing code`,
    });
  }

  const result: AppInfoResult = {
    ok: true,
    data: {
      app: {
        id,
        name,
        slug,
        description,
        lastDeploymentVersion,
      },
      inputs: parseInputForTypes(mainScript.code),
    },
  };

  return res.status(200).send(result);
}
