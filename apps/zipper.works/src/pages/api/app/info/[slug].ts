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
import jwt from 'jsonwebtoken';

/**
 * @todo
 * - security of some sort (control access for users)
 * - restrict endpoint to run server or something
 */

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

  if (appFound.requiresAuthToRun) {
    try {
      //convert the CLERK_JWT_KEY to a public key
      const splitPem = process.env.CLERK_JWT_KEY.match(/.{1,64}/g);
      const publicKey =
        '-----BEGIN PUBLIC KEY-----\n' +
        splitPem!.join('\n') +
        '\n-----END PUBLIC KEY-----';

      // get the token from the request headers. Could be a Clerk session token or a Zipper access token
      const token = req.headers.authorization?.replace('Bearer ', '');
      let auth: any = undefined;

      try {
        if (token && !token.startsWith('zaat')) {
          auth = jwt.verify(token, publicKey);
        }
      } catch (error) {}

      //if there's no token, there's no authed user
      if (!token) throw new Error();
      // if the token doesn't start with 'zaat', then there should be a clerk auth object
      // if not, then it's not a valid token
      if (!token.startsWith('zaat') && !auth) throw new Error();

      if (auth && !auth.user) {
        throw new Error();
      }
      if (!token || !token.startsWith('zaat')) throw new Error();

      const [, identifier, secret] = token.split('.');
      if (!identifier || !secret) throw new Error();

      const appAccessToken = await prisma.appAccessToken.findFirstOrThrow({
        where: {
          identifier,
          appId: appFound.id,
          deletedAt: null,
        },
      });

      const validSecret = await bcryptCompare(
        secret,
        appAccessToken.hashedSecret,
      );

      if (!validSecret) throw new Error();
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
