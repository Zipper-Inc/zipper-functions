import { App, Script, ScriptMain } from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { AppInfoResult } from '~/types/app-info';
import { parseInputForTypes } from '~/utils/parse-input-for-types';
import { safeJSONParse } from '~/utils/safe-json';

/**
 * @todo
 * - security of some sort (control access for users)
 * - restrict endpoint to run server)
 */

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!req.body || req.method !== 'POST')
    return res.status(400).send({ ok: false, error: 'bad_request' });

  const { slug } = safeJSONParse(req.body);

  let appFound:
    | (App & {
        scriptMain: ScriptMain | null;
        scripts: Script[];
      })
    | null;

  try {
    appFound = await prisma.app.findUnique({
      where: { slug },
      include: { scripts: true, scriptMain: true },
    });
  } catch (e: any) {
    return res.status(500).send({ ok: false, error: e.toString() });
  }

  if (!appFound) {
    return res.status(404).send({ ok: false, error: 'not_found' });
  }

  const { id, name, description, lastDeploymentVersion, scriptMain, scripts } =
    appFound;

  const mainScript = scripts.find(
    (script) => script.id === scriptMain?.scriptId,
  );

  if (!mainScript || !mainScript.code) {
    return res.status(500).send({ ok: false, error: 'missing_code' });
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
