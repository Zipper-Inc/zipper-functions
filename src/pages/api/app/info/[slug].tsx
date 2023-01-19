import { AuthResult } from '@clerk/nextjs/dist/server/types';
import { App, Script, ScriptMain } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { AppInfoResult } from '~/types/app-info';
import { parseInputForTypes } from '~/utils/parse-input-for-types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slugFromUrl = req.query?.slug as string;

  let result: AppInfoResult;
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
    result = { ok: false, error: e.toString() };
    return res.status(500).send(AuthResult);
  }

  if (!appFound) {
    result = { ok: false, error: 'not_found' };
    return res.status(404).send(result);
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
    result = { ok: false, error: 'missing_code' };
    return res.status(500).send(result);
  }

  result = {
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

  /**
   * @todo
   * - security of some sort (control access for users)
   * - restrict endpoint to run server)
   */

  return res.status(200).send(result);
}
