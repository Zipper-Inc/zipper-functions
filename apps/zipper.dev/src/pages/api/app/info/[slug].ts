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
import jwt, { JwtPayload } from 'jsonwebtoken';
import clerkClient from '@clerk/clerk-sdk-node';
import { compare } from 'bcryptjs';
import { canUserEdit } from '~/server/routers/app.router';
import { requiredUserAuthConnectorFilter } from '~/utils/user-auth-connector-filter';
import { ZIPPER_TEMP_USER_ID_HEADER } from '@zipper/utils';
import * as Sentry from '@sentry/nextjs';

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

  let userInfo: {
    clerkUserId?: string;
    email?: string;
    organizations: Record<string, string>[];
  } = {
    email: undefined,
    organizations: [],
  };

  // get the token from the request headers. Could be a Clerk session token or a Zipper access token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
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

  const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
    where: {
      resourceOwnerId: appFound.organizationId || appFound.createdById,
    },
  });

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
    hash,
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
        canUserEdit: canUserEdit(appFound, {
          req,
          userId: userInfo.clerkUserId,
          orgId: undefined,
          organizations: userInfo.organizations,
        }),
        hash,
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
        email: appFound.requiresAuthToRun ? userInfo.email : undefined,
        userId: appFound.requiresAuthToRun ? userInfo.clerkUserId : undefined,
      },
      entryPoint: {
        filename: entryPoint.filename,
        editUrl: `${
          process.env.NODE_ENV === 'development' ? 'http' : 'https'
        }://${process.env.NEXT_PUBLIC_HOST}${
          process.env.NODE_ENV === 'development' ? ':3000' : ''
        }/${resourceOwner?.slug}/${appFound.slug}/edit/${entryPoint.filename}`,
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

      return {
        email: auth.primary_email,
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
    Sentry.captureException(e);
    return { email: undefined, organizations: [] };
  }
}
