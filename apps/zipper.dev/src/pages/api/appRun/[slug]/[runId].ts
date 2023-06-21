import {
  App,
  AppConnector,
  AppConnectorUserAuth,
  AppEditor,
  AppRun,
  Script,
} from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { RunInfoResult, UserAuthConnector } from '@zipper/types';
import clerkClient from '@clerk/clerk-sdk-node';
import { compare } from 'bcryptjs';
import { canUserEdit } from '~/server/routers/app.router';
import { parseInputForTypes } from '~/utils/parse-code';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import { verifyAccessToken } from '~/utils/jwt-utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!process.env.CLERK_JWT_KEY) throw new Error('Missing Clerk JWT key');
  const runIdFromUrl = req.query.runId as string;
  if (runIdFromUrl.length < 8) {
    return res.status(500).send({ ok: false, error: 'Invalid run id' });
  }
  const slugFromUrl = req.query.slug as string;

  let userInfo: {
    clerkUserId?: string;
    email?: string;
    organizations: Record<string, string>[];
  } = {
    organizations: [],
  };

  let appRun:
    | (AppRun & {
        app:
          | (App & {
              editors: AppEditor[];
              scripts: Script[];
              connectors: (AppConnector & {
                appConnectorUserAuths: AppConnectorUserAuth[];
              })[];
            })
          | null;
      })
    | null = null;
  // get the token from the request headers. Could be a Clerk session token or a Zipper access token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    userInfo = await getUserInfo(token, slugFromUrl);
  }
  const userIdOrTempId =
    userInfo.clerkUserId ||
    (req.headers[ZIPPER_TEMP_USER_ID_HEADER] as string | undefined) ||
    '';

  try {
    appRun = await prisma.appRun.findFirst({
      where: {
        id: { startsWith: runIdFromUrl },
        app: { slug: slugFromUrl },
      },
      include: {
        app: {
          include: {
            editors: true,
            scripts: true,
            connectors: {
              include: {
                appConnectorUserAuths: {
                  where: {
                    userIdOrTempId,
                  },
                },
              },
            },
          },
        },
      },
    });
  } catch (e: any) {
    return res.status(500).send({ ok: false, error: e.toString() });
  }

  if (!appRun || !appRun.app) {
    return res.status(404).send({
      ok: false,
      error: `There are no apps with slug: ${slugFromUrl}`,
    });
  }

  const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
    where: {
      resourceOwnerId: appRun.app.organizationId || appRun.app.createdById,
    },
  });

  let entryPoint = appRun.app.scripts.find((s) => s.filename === appRun?.path);

  if (!entryPoint) {
    entryPoint = appRun.app.scripts.find((s) => s.filename === 'main.ts');
  }

  let result: any = appRun.result;

  if (appRun.userId && appRun.app.requiresAuthToRun) {
    // return 401 if there's no token or no user was found by getUserInfo()
    if (!token || !userInfo.clerkUserId) {
      return res.status(401).send({ ok: false, error: 'UNAUTHORIZED' });
    }

    if (appRun.userId !== userInfo.clerkUserId) {
      result =
        "You're not authorized to view this run. Try re-running the app.";
    }
  }

  const { id, name, slug, description, updatedAt, scripts, hash } = appRun.app;

  const runInfoResult: RunInfoResult = {
    ok: true,
    data: {
      appRun: {
        path: appRun.path,
        version: appRun.version || 'latest',
        result,
        inputs: appRun.inputs as Record<string, string>,
      },
      app: {
        id,
        name,
        slug,
        description,
        lastDeploymentVersion: appRun.version,
        updatedAt,
        canUserEdit: false,
        // canUserEdit: canUserEdit(appRun.app, {
        //   req,
        //   userId: userInfo.clerkUserId,
        //   orgId: undefined,
        //   organizations: userInfo.organizations,
        // }),
        hash,
      },
      inputs: parseInputForTypes({ code: entryPoint?.code }) || [],
      runnableScripts: scripts
        .filter((s) => s.isRunnable)
        .map((s) => s.filename),
      userAuthConnectors: appRun.app.connectors.filter(
        requiredUserAuthConnectorFilter,
      ) as UserAuthConnector[],
      userInfo: {
        email: undefined,
        userId: undefined,
      },
      entryPoint: {
        filename: appRun.path,
        editUrl: `${process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL}/${resourceOwner?.slug}/${appRun.app.slug}/edit/${appRun.path}`,
      },
    },
  };

  return res.status(200).send(runInfoResult);
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

async function getUserInfo(token: string, appSlug: string) {
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
        email: auth.primaryEmail,
        clerkUserId: auth.sub,
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

      const [user, orgs] = await Promise.all([
        clerkClient.users.getUser(appAccessToken.userId),
        clerkClient.users.getOrganizationMembershipList({
          userId: appAccessToken.userId,
        }),
      ]);

      if (!user) throw new Error('No Clerk user');

      return {
        email: user.emailAddresses.find(
          (e) => e.id === user.primaryEmailAddressId,
        ),
        clerkUserId: user.id,
        organizations: orgs || [],
      };
    }
  } catch (e) {
    return { email: undefined, organizations: [] };
  }
}
