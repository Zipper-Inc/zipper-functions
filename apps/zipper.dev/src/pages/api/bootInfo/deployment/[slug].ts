import { formatDeploymentId, type DeploymentParams } from '@zipper/utils';
import { NextApiHandler } from 'next';
import { prisma } from '~/server/prisma';
import { getAppVersionFromHash } from '~/utils/hashing';
import noop from '~/utils/noop';

const handler: NextApiHandler = async (req, res) => {
  const result = await prisma.app
    .findFirst({
      select: { id: true, publishedVersionHash: true },
      where: {
        slug: req.query.slug as string,
      },
    })
    .catch(noop);

  if (!result || !result.id || !result.publishedVersionHash)
    return res.status(404).json({ ok: false, error: 'Not found', status: 404 });

  const appId = result.id;
  const version = getAppVersionFromHash(result.publishedVersionHash) || '';
  const deploymentId = formatDeploymentId({ appId, version });

  return res.status(200).json({
    ok: true,
    data: {
      appId,
      version,
      deploymentId,
    },
  });
};

export default handler;
