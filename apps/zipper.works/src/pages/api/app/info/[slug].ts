import { App, AppConnector, Script, ScriptMain } from '@prisma/client';
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
  const body = JSON.parse(req.body);
  const userId: string | undefined = body.userId;

  let appFound:
    | (App & {
        scriptMain: ScriptMain | null;
        scripts: Script[];
        connectors: AppConnector[];
      })
    | null;

  try {
    appFound = await prisma.app.findUnique({
      where: { slug: slugFromUrl },
      include: { scripts: true, scriptMain: true, connectors: true },
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
    updatedAt,
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

  const isUserAuthRequired = !!appFound.connectors.find(
    (c) => c.isUserAuthRequired,
  );

  if (isUserAuthRequired && !userId) {
    return res.status(401).send({ ok: false, error: 'User is not authorized' });
  }

  if (isUserAuthRequired) {
    const appConnectorUserAuths = await prisma.appConnectorUserAuth.findMany({
      where: {
        appId: id,
        userIdOrTempId: userId,
      },
    });

    const missingAuths: string[] = [];

    appFound.connectors.forEach((connector) => {
      const authFound = appConnectorUserAuths.find(
        (auth) =>
          auth.connectorType === connector.type &&
          auth.appId === connector.appId,
      );

      if (!authFound) {
        missingAuths.push(connector.type);
      }
    });

    if (missingAuths.length > 0) {
      return res.status(401).send({
        ok: false,
        error: `User is not authorized for connectors: ${missingAuths.join(
          ', ',
        )}`,
      });
    }
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
        updatedAt,
      },
      inputs: parseInputForTypes(mainScript.code),
      connectors: appFound.connectors.map((c) => ({
        type: c.type,
        isUserAuthRequired: c.isUserAuthRequired,
      })),
    },
  };

  return res.status(200).send(result);
}
