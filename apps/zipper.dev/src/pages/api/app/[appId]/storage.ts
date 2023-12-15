import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { Prisma } from '@prisma/client';
import { JSONObject } from 'superjson/dist/types';
import { verifyHmac } from '~/utils/verify-hmac';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { body, method, query, headers } = req;

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

  console.log('[Zipper.storage] HMAC verified');

  const { appId } = query;

  const app = await prisma.app.findUniqueOrThrow({
    where: { id: appId as string },
    select: { datastore: true },
  });

  let datastore = app.datastore as JSONObject;

  switch (method) {
    case 'GET': {
      const k = query.key as string;
      if (k && datastore) {
        res.send({ key: k, value: datastore[k] || undefined });
        break;
      }
      res.send(datastore || {});
      break;
    }
    case 'POST': {
      if (jsonBody.key) {
        datastore = datastore || {};
        datastore[jsonBody.key] = jsonBody.value;

        await prisma.app.update({
          where: { id: appId as string },
          data: { datastore: datastore as Prisma.InputJsonValue },
        });

        res.send({ key: jsonBody.key, value: datastore[jsonBody.key] });
        break;
      }
      res.status(400).send({ error: 'Missing key' });
      break;
    }
    case 'DELETE': {
      if (query.key) {
        delete datastore[query.key as string];
        await prisma.app.update({
          where: { id: appId as string },
          data: { datastore: datastore as Prisma.InputJsonValue },
        });
        res.send(true);
        break;
      }
      res.status(400).send({ error: 'Missing key' });
      break;
    }
    default: {
      res
        .status(400)
        .send({ error: 'Unsupported method: use GET, POST, or DELETE' });
    }
  }
}
