import { App, AppEditor, Script } from '@prisma/client';
import {
  AppInfo,
  BootInfo,
  BootInfoWithUserInfo,
  UserAuthConnector,
  UserInfoForBoot,
  Connector,
} from '@zipper/types';
import { getZipperDotDevUrl, ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { canUserEdit as canUserEditFn } from '~/server/routers/app.router';
import { trackEvent } from '~/utils/api-analytics';
import {
  AppletAuthorReturnType,
  getUserInfo,
  UserInfoReturnType,
} from '~/utils/get-user-info';
import { parseCodeSerializable } from '~/utils/parse-code';

type BootInfoError = Error & { status?: number };

const EMPTY_USER_INFO: UserInfoReturnType = {
  organizations: [],
};

const bootInfoError = (msg: string, status: number): BootInfoError => {
  const error: Error & { status?: number } = new Error(msg);
  error.status = status;
  return error;
};

export async function assertRunLimit({
  appId,
  slug,
  dailyRunLimit = 10000,
}: {
  appId: string;
  slug: string;
  dailyRunLimit?: number;
}) {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const dailyRuns = await prisma.appRun.count({
    where: {
      appId: appId,
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
      userId: '',
      properties: {
        slug: slug,
        appletId: appId,
      },
    });
  }

  // Send error if we are at the rate limit
  if (process.env.NODE_ENV !== 'development' && dailyRuns >= dailyRunLimit) {
    return bootInfoError(
      'DAILY RUN LIMIT EXCEEDED. Please email support@zipper.dev to increase your limit.',
      429,
    );
  }
}

export async function getUserInfoFromRequest(
  req: NextApiRequest,
): Promise<UserInfoReturnType> {
  const token = req.headers.authorization?.replace('Bearer', '').trim();
  const slugFromUrl = req.query.slug as string;
  return token && token.length > 0
    ? getUserInfo(token, slugFromUrl)
    : EMPTY_USER_INFO;
}

export async function getCanUserEdit({
  appInfo,
  userInfo,
  req,
}: {
  appInfo: AppInfo;
  userInfo: UserInfoReturnType;
  req: NextApiRequest;
}) {
  const organizations = userInfo.organizations?.reduce<Record<string, string>>(
    (orgs, mem) => {
      return {
        ...orgs,
        [mem.organization.id]: mem.role,
      };
    },
    {},
  );

  return canUserEditFn(appInfo, {
    req,
    userId: userInfo.userId,
    orgId: undefined,
    organizations: organizations,
    session: undefined,
  });
}

export async function getUserAuthConnectors({
  appInfo,
  userInfo,
  req,
}: {
  appInfo: AppInfo;
  userInfo: UserInfoReturnType;
  req: NextApiRequest;
}) {
  return prisma.appConnector.findMany({
    where: { appId: appInfo.id, isUserAuthRequired: true },
    include: {
      appConnectorUserAuths: {
        where: {
          userIdOrTempId:
            userInfo.userId ||
            (req.headers[ZIPPER_TEMP_USER_ID_HEADER] as string) ||
            '',
        },
      },
    },
  }) as Promise<UserAuthConnector[]>;
}

export async function getExtendedUserInfo({
  appInfo: appInfoPassedIn,
  userInfo: userInfoPassedIn,
  req,
}: {
  appInfo?: AppInfo;
  userInfo?: UserInfoReturnType;
  req: NextApiRequest;
}): Promise<UserInfoForBoot | BootInfoError> {
  let appInfo: AppInfo | undefined;
  try {
    appInfo = appInfoPassedIn || JSON.parse(req.body).appInfo;
  } catch (e) {}

  if (!appInfo) {
    return bootInfoError('Missing app info', 400);
  }

  let userInfo: UserInfoReturnType | undefined;
  try {
    userInfo = userInfoPassedIn || (await getUserInfoFromRequest(req));
  } catch (e) {}

  if (!userInfo) {
    return bootInfoError('Missing user info', 400);
  }

  const canUserEdit = await getCanUserEdit({ appInfo, userInfo, req });

  return {
    appInfo: {
      ...appInfo,
      canUserEdit,
    },
    userAuthConnectors:
      (await getUserAuthConnectors({
        appInfo,
        userInfo,
        req,
      })) || [],
    userInfo: {
      ...userInfo,
      canUserEdit,
    },
  };
}

export async function getBootInfoWithUserInfo(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<BootInfoWithUserInfo | void> {
  const slugFromUrl = req.query.slug as string;
  const body = JSON.parse(req.body);

  const [bootInfo, userInfo] = await Promise.all([
    getBootInfoFromPrisma({ slugFromUrl, filename: body.filename }),
    getUserInfoFromRequest(req),
  ]);

  if (!bootInfo || bootInfo instanceof Error) {
    res.status(bootInfo?.status || 500).send(
      JSON.stringify({
        ok: false,
        error: bootInfo?.message || 'Missing boot info',
      }),
    );
    return;
  }
  const extendedUserInfo = await getExtendedUserInfo({
    appInfo: bootInfo.app,
    userInfo,
    req,
  });

  if (extendedUserInfo instanceof Error) {
    res.status(extendedUserInfo?.status || 500).send(
      JSON.stringify({
        ok: false,
        error: extendedUserInfo?.message || 'Missing user info',
      }),
    );
    return;
  }

  return {
    ...bootInfo,
    ...extendedUserInfo,
  };
}

export async function getResourceOwnerSlug({
  organizationId,
  createdById,
}: Pick<App, 'organizationId' | 'createdById'>) {
  return prisma.resourceOwnerSlug.findFirst({
    where: {
      resourceOwnerId: organizationId || createdById,
    },
  });
}

export async function getAppAuthor({
  editors,
  organizationId,
}: Pick<App, 'organizationId'> & { editors: AppEditor[] }) {
  const author = editors.find((editor) => editor.isOwner === true);
  const appAuthor: AppletAuthorReturnType = {
    name: '',
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

  return appAuthor;
}

export async function getBootInfoFromPrisma({
  slugFromUrl,
  filename,
}: {
  slugFromUrl: string;
  filename?: string;
}): Promise<BootInfo | BootInfoError> {
  const appFound = await prisma.app.findUnique({
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      updatedAt: true,
      scriptMain: true,
      scripts: true,
      isPrivate: true,
      requiresAuthToRun: true,
      isDataSensitive: true,
      editors: true,
      organizationId: true,
      connectors: true,
    },
    where: { slug: slugFromUrl },
  });

  if (!appFound) {
    return bootInfoError('App not found', 404);
  }

  const {
    id,
    name,
    slug,
    description,
    updatedAt,
    scriptMain,
    scripts,
    isPrivate,
    requiresAuthToRun,
    isDataSensitive,
    editors,
    organizationId,
    connectors,
  } = appFound;

  assertRunLimit({ appId: id, slug });

  let entryPoint: Script | undefined = undefined;

  if (filename) {
    entryPoint = scripts.find(
      (s) =>
        s.filename === filename ||
        s.filename === `${filename}.ts` ||
        s.filename === `${filename}.tsx`,
    );
  }

  if (!entryPoint) {
    entryPoint = scripts.find((s) => s.id === scriptMain?.scriptId);
  }

  if (!entryPoint || !entryPoint.code) {
    return bootInfoError(`Can't get entry point for app: ${slug}`, 500);
  }

  const parsedScripts = scripts.reduce<
    Record<string, ReturnType<typeof parseCodeSerializable>>
  >(
    (parsed, script) => ({
      ...parsed,
      [script.filename]: parseCodeSerializable({ code: script.code }),
    }),
    {},
  );

  const parsedEntryPoint = parsedScripts[entryPoint.filename];

  const [resourceOwner, appAuthor] = await Promise.all([
    getResourceOwnerSlug(appFound),
    getAppAuthor(appFound),
  ]);

  return {
    app: {
      id,
      name,
      slug,
      description,
      updatedAt,
      appAuthor,
      isDataSensitive,
      isPrivate,
      requiresAuthToRun,
      editors,
      organizationId,
    },
    connectors: (connectors || []) as Connector[],
    inputs: parsedEntryPoint?.inputs || [],
    metadata: {
      h1: parsedEntryPoint?.comments?.tags.find(
        (t) => t.tag === 'heading' && t.name === 'h1',
      )?.description,
      h2: parsedEntryPoint?.comments?.tags.find(
        (t) => t.tag === 'heading' && t.name === 'h2',
      )?.description,
    },
    parsedScripts,
    runnableScripts: scripts.filter((s) => s.isRunnable).map((s) => s.filename),
    entryPoint: {
      filename: entryPoint.filename,
      editUrl: `${getZipperDotDevUrl().origin}/${resourceOwner?.slug}/${
        appFound.slug
      }/src/${entryPoint.filename}`,
    },
  };
}
