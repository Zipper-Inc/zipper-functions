import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { verifyHmac } from '~/utils/verify-hmac';
import { decryptFromBase64 } from '@zipper/utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, query, headers } = req;

  const jsonBody = body ? JSON.parse(body) : {};

  const hmac = headers['x-zipper-hmac'] as string;
  if (!hmac || !process.env.HMAC_SIGNING_SECRET) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  if (!verifyHmac(req, process.env.HMAC_SIGNING_SECRET)) {
    res.status(401).send({ error: 'Unauthorized' });
    return;
  }

  console.log('HMAC verified');

  const { appId } = query;

  const app = await prisma.app.findUniqueOrThrow({
    where: { id: appId as string },
    include: {
      connectors: {
        include: {
          appConnectorUserAuths: {
            where: {
              userIdOrTempId: jsonBody.userId,
            },
          },
        },
      },
    },
  });

  const missingConnectorAuths = app.connectors.filter((connector) => {
    if (
      connector.isUserAuthRequired &&
      connector.appConnectorUserAuths.length === 0
    ) {
      return true;
    }
  });

  const authTokens: Record<string, string> = {};

  app.connectors.forEach((connector) => {
    connector.appConnectorUserAuths.forEach((auth) => {
      authTokens[`${auth.connectorType.toUpperCase()}_USER_TOKEN`] =
        decryptFromBase64(
          auth.encryptedAccessToken,
          process.env.ENCRYPTION_KEY,
        );
    });
  });

  return {
    missingConnectorAuths,
    authTokens,
  };
}
