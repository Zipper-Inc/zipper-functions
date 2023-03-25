import {
  App,
  AppConnector,
  AppConnectorUserAuth,
  Script,
  ScriptMain,
} from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { AppInfoResult } from '@zipper/types';
import { parseInputForTypes } from '~/utils/parse-input-for-types';
import { getAuth } from '@clerk/nextjs/server';
import { withAuth } from '@clerk/nextjs/dist/api';

/**
 * @todo
 * - security of some sort (control access for users)
 * - restrict endpoint to run server or something
 */

export default withAuth(async (req: NextApiRequest, res: NextApiResponse) => {
  const slugFromUrl = req.query.slug as string;
  const body = JSON.parse(req.body);
  const userId: string | undefined = body.userId;

  const auth = getAuth(req);

  let appFound:
    | (App & {
        scriptMain: ScriptMain | null;
        scripts: Script[];
        connectors: (AppConnector & {
          appConnectorUserAuths: AppConnectorUserAuth[];
        })[];
      })
    | null;

  try {
    appFound = await prisma.app.findUnique({
      where: { slug: slugFromUrl },
      include: {
        scripts: true,
        scriptMain: true,
        connectors: {
          include: {
            appConnectorUserAuths: {
              where: { userIdOrTempId: userId || '' },
            },
          },
        },
      },
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

  if (appFound.requiresAuthToRun && !auth.userId) {
    return res.status(401).send({
      ok: false,
      error: 'UNAUTHORIZED',
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

  let entryPoint: Script | undefined = undefined;

  if (body.filename) {
    entryPoint = scripts.find(
      (s) =>
        s.filename === body.filename || s.filename === `${body.filename}.ts`,
    );
  }

  if (!entryPoint) {
    entryPoint = scripts.find((s) => s.id === scriptMain?.scriptId);
  }

  if (!entryPoint || !entryPoint.code) {
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
        updatedAt,
      },
      inputs: parseInputForTypes(entryPoint.code),
      userAuthConnectors: appFound.connectors.filter(
        (c) => c.userScopes.length > 0,
      ),
    },
  };

  return res.status(200).send(result);
});
