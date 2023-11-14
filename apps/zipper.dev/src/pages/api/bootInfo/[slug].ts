import { ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import type { NextApiRequest, NextApiResponse } from 'next';
import { getUserInfo, UserInfoReturnType } from '~/utils/get-user-info';
import { collectBootInfo } from '~/utils/boot-info-utils';
import { prisma } from '~/server/prisma';
import { BootInfoWithUser, UserAuthConnector } from '@zipper/types';
import { canUserEdit } from '~/server/routers/app.router';

export async function getBootInfoWithUserFromRequest(
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

  const info = await collectBootInfo({
    slugFromUrl,
    filename: body.filename,
  });

  if (info instanceof Error) {
    return res
      .status(info.status || 500)
      .send(JSON.stringify({ ok: false, error: info.message }));
  }

  const organizations: Record<string, string> = {};

  userInfo?.organizations?.forEach((mem) => {
    organizations[mem.organization.id] = mem.role;
  });

  const canUserEditBool = canUserEdit(info.app, {
    req,
    userId: userInfo.userId,
    orgId: undefined,
    organizations: organizations,
    session: undefined,
  });

  const userAuthConnectors = await prisma.appConnector.findMany({
    where: { appId: info.app.id },
    include: {
      appConnectorUserAuths: {
        where: {
          userIdOrTempId: userInfo.userId || tempUserId || '',
        },
      },
    },
  });

  const data: BootInfoWithUser = {
    ...info,
    userAuthConnectors: userAuthConnectors.filter(
      (c) => c.isUserAuthRequired,
    ) as UserAuthConnector[],
    userInfo: {
      ...userInfo,
      canUserEdit: canUserEditBool,
    },
  };

  return data;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const data = await getBootInfoWithUserFromRequest(req, res);
  res.status(200).send(JSON.stringify({ ok: true, data }));
}
