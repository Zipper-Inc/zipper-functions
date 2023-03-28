import {
  App,
  AppConnector,
  AppConnectorUserAuth,
  Script,
  ScriptMain,
} from '@prisma/client';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import { AppInfoResult } from '@zipper/types';
import { parseInputForTypes } from '~/utils/parse-input-for-types';
import { bcryptCompare } from '@zipper/utils';
import jwt, { JwtPayload } from 'jsonwebtoken';
import clerkClient from '@clerk/clerk-sdk-node';

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
  const userId: string | undefined = body.userId;

  let appFound:
    | (App & {
        scriptMain: ScriptMain | null;
        scripts: Script[];
        connectors: (AppConnector & {
          appConnectorUserAuths: AppConnectorUserAuth[];
        })[];
      })
    | null;

  try {
    appFound = await prisma.app.findUnique({
      where: { slug: slugFromUrl },
      include: {
        scripts: true,
        scriptMain: true,
        connectors: {
          include: {
            appConnectorUserAuths: {
              where: { userIdOrTempId: userId || '' },
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

  if (appFound.requiresAuthToRun) {
    try {
      // get the token from the request headers. Could be a Clerk session token or a Zipper access token
      const token = req.headers.authorization?.replace('Bearer ', '');

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
      } else {
        // Validate the Zipper access token
        // The token should be in the format: zaat.{identifier}.{secret}
        const [, identifier, secret] = token.split('.');
        if (!identifier || !secret) throw new Error('Invalid Zipper token');

        const appAccessToken = await prisma.appAccessToken.findFirstOrThrow({
          where: {
            identifier,
            appId: appFound.id,
            deletedAt: null,
          },
        });

        // compare the hashed secret with a hash of the secret portion of the token
        const validSecret = await bcryptCompare(
          secret,
          appAccessToken.hashedSecret,
        );

        if (!validSecret) throw new Error();
      }
    } catch (e: any) {
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
      },
      inputs: parseInputForTypes(entryPoint.code),
      userAuthConnectors: appFound.connectors.filter(
        (c) => c.userScopes.length > 0,
      ),
    },
  };

  return res.status(200).send(result);
}
