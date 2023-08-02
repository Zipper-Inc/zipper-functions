import {
  App,
  AppConnector,
  AppConnectorUserAuth,
  AppEditor,
  AppRun,
  Script,
} from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { RunInfoResult, UserAuthConnector } from '@zipper/types';
import { canUserEdit } from '~/server/routers/app.router';
import { parseInputForTypes } from '~/utils/parse-code';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { getZipperDotDevUrl, ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import { getUserInfo, UserInfoReturnType } from '../../app/info/[slug]';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const runIdFromUrl = req.query.runId as string;
  if (runIdFromUrl.length < 8) {
    return res.status(500).send({ ok: false, error: 'Invalid run id' });
  }
  const slugFromUrl = req.query.slug as string;

  let userInfo: UserInfoReturnType = {
    organizations: [],
  };

  let appRun:
    | (AppRun & {
        app:
          | (App & {
              editors: AppEditor[];
              scripts: Script[];
              connectors: (AppConnector & {
                appConnectorUserAuths: AppConnectorUserAuth[];
              })[];
            })
          | null;
      })
    | null = null;
  // get the token from the request headers. Could be a Clerk session token or a Zipper access token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    userInfo = await getUserInfo(token, slugFromUrl);
  }
  const userIdOrTempId =
    userInfo.userId ||
    (req.headers[ZIPPER_TEMP_USER_ID_HEADER] as string | undefined) ||
    '';

  try {
    appRun = await prisma.appRun.findFirst({
      where: {
        id: { startsWith: runIdFromUrl },
        app: { slug: slugFromUrl },
      },
      include: {
        app: {
          include: {
            editors: true,
            scripts: true,
            connectors: {
              include: {
                appConnectorUserAuths: {
                  where: {
                    userIdOrTempId,
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (e: any) {
    return res.status(500).send({ ok: false, error: e.toString() });
  }

  if (!appRun || !appRun.app) {
    return res.status(404).send({
      ok: false,
      error: `There are no apps with slug: ${slugFromUrl}`,
    });
  }

  const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
    where: {
      resourceOwnerId: appRun.app.organizationId || appRun.app.createdById,
    },
  });

  let entryPoint = appRun.app.scripts.find((s) => s.filename === appRun?.path);

  if (!entryPoint) {
    entryPoint = appRun.app.scripts.find((s) => s.filename === 'main.ts');
  }

  let result: any = appRun.result;

  if (appRun.userId && appRun.app.requiresAuthToRun) {
    // return 401 if there's no token or no user was found by getUserInfo()
    if (!token || !userInfo.userId) {
      return res.status(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }

    if (appRun.userId !== userInfo.userId) {
      result =
        "You're not authorized to view this run. Try re-running the app.";
    }
  }

  const { id, name, slug, description, updatedAt, scripts, isDataSensitive } =
    appRun.app;

  const organizations: Record<string, string> = {};

  userInfo?.organizations?.forEach((mem) => {
    organizations[mem.organization.id] = mem.role;
  });

  const runInfoResult: RunInfoResult = {
    ok: true,
    data: {
      appRun: {
        path: appRun.path,
        version: appRun.version || 'latest',
        result,
        inputs: appRun.inputs as Record<string, string>,
      },
      app: {
        id,
        name,
        slug,
        description,
        updatedAt,
        playgroundVersionHash: appRun.version,
        publishedVersionHash: appRun.version,
        canUserEdit: canUserEdit(appRun.app, {
          req,
          userId: userInfo.userId,
          orgId: undefined,
          organizations,
        }),
        isDataSensitive,
      },
      inputs: parseInputForTypes({ code: entryPoint?.code }) || [],
      runnableScripts: scripts
        .filter((s) => s.isRunnable)
        .map((s) => s.filename),
      userAuthConnectors: appRun.app.connectors.filter(
        requiredUserAuthConnectorFilter,
      ) as UserAuthConnector[],
      userInfo: {
        email: undefined,
        userId: undefined,
      },
      entryPoint: {
        filename: appRun.path,
        editUrl: `${getZipperDotDevUrl().origin}/${resourceOwner?.slug}/${
          appRun.app.slug
        }/edit/${appRun.path}`,
      },
    },
  };

  return res.status(200).send(runInfoResult);
}
