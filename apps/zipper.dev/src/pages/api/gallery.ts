import { appSubmissionState } from '@zipper/types';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { defaultAvatarColors } from '~/components/app-avatar';
import Cors from 'cors';
import IORedis from 'ioredis';
import { env } from '~/server/env';
import { redis } from '~/server/queue';

const EXPIRATION_DURATION_IN_SECONDS = 60 * 60; // 1 hour

const cors = Cors({
  methods: ['POST', 'GET', 'HEAD'],
});

function runMiddleware(
  req: NextApiRequest,
  res: NextApiResponse,
  fn: (req: NextApiRequest, res: NextApiResponse, next: any) => void,
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }

      return resolve(result);
    });
  });
}

const handler: NextApiHandler = async (req, res) => {
  await runMiddleware(req, res, cors);

  const result = await redis.get('galleryCache');

  // cache hit
  if (result) {
    return res.json(JSON.parse(result));
  }

  // cache miss
  const apps = await prisma.app.findMany({
    where: {
      submissionState: appSubmissionState.approved,
      deletedAt: null,
      isPrivate: false,
    },
  });

  const resourceOwners = await prisma.resourceOwnerSlug.findMany({
    where: {
      resourceOwnerId: {
        in: apps
          .map((a) => a.organizationId || a.createdById)
          .filter((i) => !!i) as string[],
      },
    },
  });

  const appsWithResourceOwnerSlug = apps.reduce(
    (arr, app) => {
      const resourceOwner = resourceOwners.find(
        (r) => r.resourceOwnerId === (app.organizationId || app.createdById),
      );

      if (resourceOwner) {
        arr.push({
          name: app.name,
          description: app.description,
          slug: app.slug,
          resourceOwner: { slug: resourceOwner.slug },
          iconUrl: encodeURI(
            `https://source.boringavatars.com/bauhaus/120/${
              app.slug
            }?colors=${defaultAvatarColors
              .join(',')
              .replaceAll('#', '')}&square`,
          ),
        });
      }
      return arr;
    },
    // prettier-ignore
    [] as {
      name: string | null;
      iconUrl: string;
      description: string | null;
      slug: string;
      resourceOwner: { slug: string };
    }[],
  );

  redis.set(
    'galleryCache',
    JSON.stringify(appsWithResourceOwnerSlug),
    'EX',
    EXPIRATION_DURATION_IN_SECONDS,
  );
  res.json(appsWithResourceOwnerSlug);
};

export default handler;
