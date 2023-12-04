import {
  App,
  AppConnector,
  AppConnectorUserAuth,
  AppEditor,
  Script,
  ScriptMain,
} from '@prisma/client';
import { BootInfoResult, UserAuthConnector } from '@zipper/types';
import { getZipperDotDevUrl, ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { canUserEdit } from '~/server/routers/app.router';
import { trackEvent } from '~/utils/api-analytics';
import { parseCode } from '~/utils/parse-code';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import {
  getUserInfo,
  UserInfoReturnType,
  AppletAuthorReturnType,
} from '../../../utils/get-user-info';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const slugFromUrl = req.query.slug as string;
  const body = JSON.parse(req.body);

  let userInfo: UserInfoReturnType = {
    organizations: [],
  };

  // get the token from the request headers. Could be a Clerk session token or a Zipper access token
  let token = req.headers.authorization;
  token = token?.replace('Bearer', '').trim();
  if (token && token.length > 0) {
    userInfo = await getUserInfo(token, slugFromUrl);
  }
  const tempUserId = req.headers[ZIPPER_TEMP_USER_ID_HEADER] as
    | string
    | undefined;

  let appFound:
    | (App & {
        scriptMain: ScriptMain | null;
        scripts: Script[];
        editors: AppEditor[];
        connectors: (AppConnector & {
          appConnectorUserAuths: AppConnectorUserAuth[];
        })[];
      })
    | null;

  try {
    appFound = await prisma.app.findUnique({
      where: { slug: slugFromUrl },
      include: {
        editors: true,
        scripts: true,
        scriptMain: true,
        connectors: {
          include: {
            appConnectorUserAuths: {
              where: {
                userIdOrTempId: userInfo.userId || tempUserId || '',
              },
            },
          },
        },
      },
    });
  } catch (e: any) {
    return res
      .status(500)
      .send({ ok: false, status: 500, error: e.toString() });
  }

  if (!appFound) {
    return res.status(404).send({
      ok: false,
      status: 404,
      error: `There are no apps with slug: ${slugFromUrl}`,
    });
  }

  const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
    where: {
      resourceOwnerId: appFound.organizationId || appFound.createdById,
    },
  });

  if (appFound.requiresAuthToRun) {
    // return 401 if there's no token or no user was found by getUserInfo()
    if (!token || !userInfo.userId) {
      return res.status(401).send({
        ok: false,
        status: 401,
        error: 'UNAUTHORIZED',
      });
    }
  }

  const {
    id,
    name,
    slug,
    description,
    updatedAt,
    publishedVersionHash,
    playgroundVersionHash,
    scriptMain,
    scripts,
    isDataSensitive,
    dailyRunLimit,
    editors,
    organizationId,
  } = appFound;

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const dailyRuns = await prisma.appRun.count({
    where: {
      appId: id,
      createdAt: {
        gte: twentyFourHoursAgo,
      },
    },
  });

  const dailyRunPercentage = Math.round((dailyRuns / dailyRunLimit) * 100);

  // Beacon when we hit 80 and 99 percent
  if (dailyRunPercentage === 80 || dailyRunPercentage === 99) {
    trackEvent({
      eventName: `Run usage at ${dailyRunPercentage}%`,
      userId: userInfo.userId,
      properties: {
        slug: slug,
        appletId: id,
      },
    });
  }

  // Send error if we are at the rate limit
  if (process.env.NODE_ENV !== 'development' && dailyRuns >= dailyRunLimit) {
    return res.status(429).send({
      ok: false,
      status: 429,
      error:
        'DAILY RUN LIMIT EXCEEDED. Please email support@zipper.dev to increase your limit.',
    });
  }

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
      status: 500,
      error: `Can't get inputs for app: ${slug} is missing code`,
    });
  }
  const parsedCode = parseCode({ code: entryPoint.code });

  const organizations: Record<string, string> = {};

  userInfo?.organizations?.forEach((mem) => {
    organizations[mem.organization.id] = mem.role;
  });

  const author = editors.find((editor) => editor.isOwner === true);
  const appAuthor: AppletAuthorReturnType = {
    name: '',
    slug: '',
    organization: '',
    image: '',
    orgImage: '',
  };

  const authorName = await prisma.user.findUnique({
    where: {
      id: author?.userId,
    },
    include: {
      organizationMemberships: true,
    },
  });

  if (organizationId) {
    const authorOrg = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
    });
    appAuthor.organization = authorOrg?.name || '';
  }

  appAuthor.name = authorName?.name || '';
  appAuthor.image = authorName?.image || '';
  appAuthor.slug = authorName?.slug || '';

  const canUserEditBool = canUserEdit(appFound, {
    req,
    userId: userInfo.userId,
    orgId: undefined,
    organizations: organizations,
    session: undefined,
  });

  const result: BootInfoResult = {
    ok: true,
    data: {
      app: {
        id,
        name,
        slug,
        description,
        playgroundVersionHash,
        publishedVersionHash,
        updatedAt,
        appAuthor,
        canUserEdit: canUserEditBool,
        isDataSensitive,
      },
      inputs: parsedCode.inputs || [],
      metadata: {
        h1: parsedCode.comments?.tags.find(
          (t) => t.tag === 'heading' && t.name === 'h1',
        )?.description,
        h2: parsedCode.comments?.tags.find(
          (t) => t.tag === 'heading' && t.name === 'h2',
        )?.description,
      },
      runnableScripts: scripts
        .filter((s) => s.isRunnable)
        .map((s) => s.filename),
      userAuthConnectors: appFound.connectors.filter(
        requiredUserAuthConnectorFilter,
      ) as UserAuthConnector[],
      userInfo: {
        email: userInfo.email,
        userId: userInfo.userId,
        canUserEdit: canUserEditBool,
      },
      entryPoint: {
        filename: entryPoint.filename,
        editUrl: `${getZipperDotDevUrl().origin}/${resourceOwner?.slug}/${
          appFound.slug
        }/src/${entryPoint.filename}`,
      },
    },
  };

  return res.status(200).send(result);
}
