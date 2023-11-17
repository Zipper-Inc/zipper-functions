import { Script } from '@prisma/client';
import { BootInfo } from '@zipper/types';
import { getZipperDotDevUrl } from '@zipper/utils';
import { prisma } from '~/server/prisma';
import { trackEvent } from '~/utils/api-analytics';
import { parseCodeSerializable } from '~/utils/parse-code';
import { AppletAuthorReturnType } from '~/utils/get-user-info';

const bootInfoError = (msg: string, status: number) => {
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

export async function collectBootInfo({
  slugFromUrl,
  filename,
}: {
  slugFromUrl: string;
  filename?: string;
}) {
  const appFound = await prisma.app.findUnique({
    where: { slug: slugFromUrl },
    include: {
      editors: true,
      scripts: true,
      scriptMain: true,
    },
  });

  if (!appFound) {
    return bootInfoError('App not found', 404);
  }

  const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
    where: {
      resourceOwnerId: appFound.organizationId || appFound.createdById,
    },
  });

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
    isPrivate,
    requiresAuthToRun,
    isDataSensitive,
    editors,
    organizationId,
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

  const bootInfo: BootInfo = {
    app: {
      id,
      name,
      slug,
      description,
      playgroundVersionHash,
      publishedVersionHash,
      updatedAt,
      appAuthor,
      isDataSensitive,
      isPrivate,
      requiresAuthToRun,
      editors,
      organizationId,
    },
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

  return bootInfo;
}
