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
import { parseInputForTypes } from '~/utils/parse-code';
import jwt, { JwtPayload } from 'jsonwebtoken';
import clerkClient from '@clerk/clerk-sdk-node';
import { compare } from 'bcryptjs';
// import { canUserEdit } from '~/server/routers/app.router';
// import { getAuth } from '@clerk/nextjs/server';

/**
 * @todo
 * - security of some sort (control access for users)
 * - restrict endpoint to run server or something
 */

// convert the CLERK_JWT_KEY to a public key
const splitPem = process.env.CLERK_JWT_KEY?.match(/.{1,64}/g);
const publicKey =
  '-----BEGIN PUBLIC KEY-----\n' +
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  splitPem!.join('\n') +
  '\n-----END PUBLIC KEY-----';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (!process.env.CLERK_JWT_KEY) throw new Error('Missing Clerk JWT key');
  const slugFromUrl = req.query.slug as string;
  const body = JSON.parse(req.body);

  let userInfo: { clerkUserId?: string; emails: string[] } = {
    emails: [],
  };

  // get the token from the request headers. Could be a Clerk session token or a Zipper access token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    userInfo = await getUserInfo(token, slugFromUrl);
  }
  const tempUserId = req.headers['x-zipper-temp-user-id'] as string | undefined;

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
                userIdOrTempId: userInfo.clerkUserId || tempUserId || '',
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

  if (appFound.requiresAuthToRun) {
    // return 401 if there's no token or no user was found by getUserInfo()
    if (!token || !userInfo.clerkUserId) {
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
    lastDeploymentVersion,
    scriptMain,
    scripts,
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

  // const { userId, sessionClaims, orgId } = getAuth(req);

  const result: AppInfoResult = {
    ok: true,
    data: {
      app: {
        id,
        name,
        slug,
        description,
        lastDeploymentVersion,
        updatedAt,
        canUserEdit: false,
        // canUserEdit: canUserEdit(appFound, {
        //   req,
        //   userId: userId || undefined,
        //   orgId: orgId || undefined,
        //   organizations: sessionClaims?.organizations as Record<
        //     string,
        //     string
        //   >[],
        // }),
      },
      inputs: parseInputForTypes({ code: entryPoint.code }) || [],
      runnableScripts: scripts
        .filter((s) => s.isRunnable)
        .map((s) => s.filename),
      userAuthConnectors: appFound.connectors.filter(
        (c) => c.userScopes.length > 0,
      ) as UserAuthConnector[],
      userInfo: {
        emails: appFound.requiresAuthToRun ? userInfo.emails : [],
        userId: appFound.requiresAuthToRun ? userInfo.clerkUserId : undefined,
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

async function getUserInfo(token: string, appSlug: string) {
  try {
    //if there's no token, there's no authed user
    if (!token) throw new Error('No token');

    const tokenType = token?.startsWith('zaat') ? 'zipper' : 'clerk';

    if (tokenType === 'clerk') {
      const auth = jwt.verify(token, publicKey) as JwtPayload;

      // if there's an auth object, but no user, then there's no authed user
      if (!auth || !auth.sub) {
        throw new Error('No Clerk user');
      }
      const user = await clerkClient.users.getUser(auth.sub);
      if (!user) throw new Error('No Clerk user');

      return {
        emails: user.emailAddresses.map((e) => e.emailAddress),
        clerkUserId: user.id,
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

      // app access tokens with a schedule ID should be deleted after being used
      if (appAccessToken.scheduleId) {
        await prisma.appAccessToken.update({
          where: {
            identifier_appId: {
              identifier: appAccessToken.identifier,
              appId: appAccessToken.appId,
            },
          },
          data: {
            deletedAt: new Date(Date.now()),
          },
        });
      }

      if (!validSecret) throw new Error();

      const user = await clerkClient.users.getUser(appAccessToken.userId);

      if (!user) throw new Error('No Clerk user');

      return {
        emails: user.emailAddresses.map((e) => e.emailAddress),
        clerkUserId: user.id,
      };
    }
  } catch (e) {
    return { emails: [] };
  }
}
