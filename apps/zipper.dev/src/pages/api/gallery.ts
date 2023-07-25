import { appSubmissionState } from '@zipper/types';
import { NextApiHandler, NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { defaultAvatarColors } from '~/components/app-avatar';
import Cors from 'cors';

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
    [] as ({name: string | null, iconUrl: string, description: string | null, slug: string, resourceOwner: {slug: string}})[],
  );

  res.json(appsWithResourceOwnerSlug);
};

export default handler;
