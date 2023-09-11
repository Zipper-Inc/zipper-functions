import {
  App,
  AppConnector,
  AppConnectorUserAuth,
  AppEditor,
  Script,
  ScriptMain,
} from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { AppInfoResult, UserAuthConnector } from '@zipper/types';
import { parseCode } from '~/utils/parse-code';
import { compare } from 'bcryptjs';
import { canUserEdit } from '~/server/routers/app.router';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { getZipperDotDevUrl, ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import * as Sentry from '@sentry/nextjs';
import { verifyAccessToken } from '~/utils/jwt-utils';
import { SessionOrganizationMembership } from '../auth/[...nextauth]';

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
    return res.status(500).send({ ok: false, error: e.toString() });
  }

  if (!appFound) {
    return res.status(404).send({
      ok: false,
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
  } = appFound;

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
      error: `Can't get inputs for app: ${slug} is missing code`,
    });
  }
  const parsedCode = parseCode({ code: entryPoint.code });

  const organizations: Record<string, string> = {};

  userInfo?.organizations?.forEach((mem) => {
    organizations[mem.organization.id] = mem.role;
  });

  const result: AppInfoResult = {
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
        canUserEdit: canUserEdit(appFound, {
          req,
          userId: userInfo.userId,
          orgId: undefined,
          organizations: organizations,
        }),
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
        email: userInfo?.email,
        userId: userInfo.userId,
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

/* There are two types of auth tokens that can be used to run an app:
      1. A Clerk session token
      2. A Zipper access token

First we check if there is a token in the request headers.  If there is,
we check if it's a Clerk session token by vefifying it with the Clerk
public key.

If it's not a Clerk token, we check that it's a Zipper access token by
looking at the first 4 characters of the token (should be 'zaat').

If it is, we take the second part of the token (the identifier) and use
that to find the hashed secret. We compare the hashed secret with a hash
of the third part of the token.
*/

export type UserInfoReturnType = {
  email?: string;
  userId?: string;
  organizations?: SessionOrganizationMembership[];
};

export async function getUserInfo(
  token: string,
  appSlug: string,
): Promise<UserInfoReturnType> {
  try {
    //if there's no token, there's no authed user
    if (!token) throw new Error('No token');

    const tokenType = token?.startsWith('zaat')
      ? 'app_access_token'
      : 'user_access_token';

    if (tokenType === 'user_access_token') {
      const auth = verifyAccessToken(token);

      // if there's an auth object, but no user, then there's no authed user
      if (!auth || !auth.sub) {
        throw new Error('No Zipper user');
      }

      return {
        email: auth.email,
        userId: auth.sub,
        organizations: auth.organizations,
      };
    } else {
      // Validate the Zipper access token
      // The token should be in the format: zaat.{identifier}.{secret}
      const [, identifier, secret] = token.split('.');
      if (!identifier || !secret) throw new Error('Invalid Zipper token');

      const appAccessToken = await prisma.appAccessToken.findFirstOrThrow({
        where: {
          identifier,
          app: {
            slug: appSlug,
          },
          deletedAt: null,
        },
      });

      // compare the hashed secret with a hash of the secret portion of the token
      const validSecret = await compare(secret, appAccessToken.hashedSecret);

      if (!validSecret) throw new Error();

      const user = await prisma.user.findUnique({
        where: {
          id: appAccessToken.userId,
        },
        include: {
          organizationMemberships: {
            include: {
              organization: true,
            },
          },
        },
      });

      if (!user) throw new Error('No user');

      return {
        email: user.email,
        userId: user.id,
        organizations: user.organizationMemberships.map((mem) => {
          return {
            organization: {
              id: mem.organization.id,
              name: mem.organization.name,
              slug: mem.organization.slug,
            },
            role: mem.role,
            pending: false,
          };
        }),
      };
    }
  } catch (e) {
    console.log(e);
    Sentry.captureException(e);
    return { email: undefined, organizations: [] };
  }
}
