import {
  App,
  AppConnector,
  AppEditor,
  Prisma,
  ResourceOwnerSlug,
  Script,
} from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';
import slugify from '~/utils/slugify';
import { generateDefaultSlug } from '~/utils/generate-default';
import { TRPCError } from '@trpc/server';
import denyList from '../utils/slugDenyList';
import { appSubmissionState, ResourceOwnerType } from '@zipper/types';
import { Context } from '../context';
import { getAppVersionFromHash, getScriptHash } from '~/utils/hashing';
import { endsWithTs, parseInputForTypes } from '~/utils/parse-code';
import {
  getInputsFromFormData,
  ZIPPER_TEMP_USER_ID_COOKIE_NAME,
} from '@zipper/utils';
import getRunUrl, { getBootUrl } from '~/utils/get-run-url';
import { randomUUID } from 'crypto';
import fetch from 'node-fetch';
import isCodeRunnable from '~/utils/is-code-runnable';
import { generateAccessToken } from '~/utils/jwt-utils';
import { getToken } from 'next-auth/jwt';
import { buildAndStoreApplet } from '~/utils/eszip-build-applet';
import JSZip from 'jszip';
import { DEFAULT_MD } from './script.router';
import { storeVersionCode } from '../utils/r2.utils';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  slug: true,
  description: true,
  isPrivate: true,
  publishedVersionHash: true,
  playgroundVersionHash: true,
  parentId: true,
  submissionState: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  createdById: true,
  requiresAuthToRun: true,
  isDataSensitive: true,
});

export const defaultCode = [
  'export async function handler({worldString}: {worldString: string}) {',
  '  return `Hello ${worldString}`;',
  '}',
].join('\n');

const defaultMainFile = 'main';
const defaultMainFilename = `${defaultMainFile}.ts`;

export const canUserEdit = (
  app: Pick<
    App & { editors: AppEditor[] },
    'editors' | 'organizationId' | 'isPrivate'
  > &
    Partial<App & { editors: AppEditor[] }>,
  ctx: Context,
) => {
  // if there's no authed user bail out and return false
  if (!ctx.userId) return false;

  // if the authed user is an editor of the app, return true
  if (!!app.editors.find((e) => e.userId === ctx.userId)) return true;

  // if the app is owned by an organization and the authed user is a member of that organization, return true
  if (app.organizationId && ctx.organizations) {
    if (Object.keys(ctx.organizations).includes(app.organizationId))
      return true;
  }

  // if the authed user is neither an editor nor a member of the resource owner organization, return false
  return false;
};

export const appRouter = createRouter()
  .mutation('add', {
    input: z
      .object({
        name: z.string().min(3).optional(),
        slug: z
          .string()
          .min(3)
          .transform((s) => slugify(s))
          .optional(),
        description: z.string().optional(),
        organizationId: z.string().nullable().optional(),
        isPrivate: z.boolean().optional().default(true),
        requiresAuthToRun: z.boolean().optional().default(false),
        aiCode: z.string().optional(),
      })
      .optional(),
    async resolve({
      input = { name: undefined, slug: undefined, description: undefined },
      ctx,
    }) {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const {
        name,
        description,
        organizationId: orgId,
        isPrivate,
        requiresAuthToRun,
        aiCode,
      } = input;
      let { slug } = input;

      // if there's a name but no slug, use the name to generate a slug
      if (name && !slug) {
        slug = slugify(name);
      }

      // if the provided slug or slugified name is in the deny list, set slug to undefined so that it gets replaced
      if (denyList.find((d) => d === input.slug)) {
        slug = undefined;
      }

      // fallback to generating a random slug if there's no name or slug provided or the name or slug is on the deny list
      if (!slug) {
        slug = generateDefaultSlug();
      }

      // increase our chances of getting a unique slug by adding a random number to the end
      // we create 3 possible slugs and check if any of them are already taken
      let possibleSlugs = [
        slug,
        `${slug}-${Math.floor(Math.random() * 100)}`,
        `${slug}-${Math.floor(Math.random() * 100)}`,
      ];

      // find existing apps with any of the slugs in possibleSlugs
      const appsWithSameSlug = await prisma.app.findMany({
        where: { slug: { in: possibleSlugs } },
      });

      // if there are existing apps with the same slug, remove the slug from possibleSlugs
      if (appsWithSameSlug.length > 0) {
        const existingSlugs = appsWithSameSlug.map((a) => a.slug);
        possibleSlugs = possibleSlugs.filter((s) => {
          return !existingSlugs.includes(s);
        });
      }

      if (possibleSlugs.length === 0) {
        throw new TRPCError({
          message: 'No possible slugs',
          code: 'INTERNAL_SERVER_ERROR',
        });
      }

      const organizationId = orgId === null ? null : orgId || ctx.orgId;

      const app = await prisma.app.create({
        data: {
          name,
          description,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          slug: possibleSlugs[0]!,
          organizationId,
          createdById: ctx.userId,
          isPrivate,
          requiresAuthToRun,
          editors: {
            create: {
              userId: ctx.userId,
              isOwner: true,
            },
          },
        },
        select: defaultSelect,
      });

      if (!app) return;

      const readme = await prisma.script.create({
        data: {
          name: 'Readme',
          filename: 'readme.md',
          code: DEFAULT_MD,
          appId: app.id,
        },
      });

      await prisma.app.update({
        where: { id: app.id },
        data: {
          scripts: {
            connect: { id: readme.id },
          },
        },
      });

      const scriptMain = await prisma.scriptMain.create({
        data: {
          app: { connect: { id: app.id } },
          script: {
            create: {
              code: aiCode ? aiCode : defaultCode,
              name: defaultMainFile,
              filename: defaultMainFilename,
              isRunnable: true,
              appId: app.id,
              order: 0,
            },
          },
        },
      });
      // get a hash of main script and update the script
      const scriptHash = getScriptHash({
        code: aiCode ?? defaultCode,
        filename: defaultMainFilename,
        id: scriptMain.scriptId,
      });
      const script = await prisma.script.update({
        where: {
          id: scriptMain.scriptId,
        },
        data: {
          hash: scriptHash,
        },
      });

      const { hash } = await buildAndStoreApplet({
        app: { ...app, scripts: [script] },
        isPublished: true,
        userId: ctx.userId,
      });

      await prisma.app.update({
        where: {
          id: app.id,
        },
        data: {
          publishedVersionHash: hash,
          playgroundVersionHash: hash,
        },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: { resourceOwnerId: app.createdById || app.organizationId },
      });

      return { ...app, scriptMain, resourceOwner };
    },
  })
  .query('allApproved', {
    async resolve() {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      const apps = await prisma.app.findMany({
        where: {
          isPrivate: false,
          submissionState: appSubmissionState.approved,
          deletedAt: null,
        },
        select: defaultSelect,
      });

      const resourceOwners = await prisma.resourceOwnerSlug.findMany({
        where: {
          resourceOwnerId: {
            in: apps
              .map((a) => a.organizationId || a.createdById)
              .filter((i) => !!i) as string[],
          },
        },
      });

      return apps.reduce(
        (arr, app) => {
          const resourceOwner = resourceOwners.find(
            (r) =>
              r.resourceOwnerId === (app.organizationId || app.createdById),
          );

          if (resourceOwner) {
            arr.push({ ...app, resourceOwner });
          }
          return arr;
        },
        // prettier-ignore
        [] as ((typeof apps)[0] & { resourceOwner: ResourceOwnerSlug })[],
      );
    },
  })
  .query('byAuthedUser', {
    input: z
      .object({
        parentId: z.string().optional(),
        filterByOrganization: z.boolean().default(true),
      })
      .optional(),
    async resolve({ ctx, input }) {
      if (!ctx.userId) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const where: Prisma.AppWhereInput = {
        parentId: input?.parentId,
        deletedAt: null,
      };

      if (ctx.orgId && (!input || input.filterByOrganization)) {
        // return apps that belong to the organization workspace you're currently in
        where.organizationId = ctx.orgId;
      } else {
        // if you're in your personal workspace, return apps that you created outside the context of an org
        // TODO: figure out how to show apps you were invited to
        where.OR = [
          {
            organizationId: null,
            createdById: ctx.userId,
          },
          {
            organizationId: {
              notIn: Object.keys(ctx.organizations || {}),
            },
            editors: { some: { userId: ctx.userId } },
          },
          {
            organizationId: null,
            editors: { some: { userId: ctx.userId } },
          },
        ];

        if (input && !input.filterByOrganization) {
          where.OR.push({
            organizationId: {
              in: Object.keys(ctx.organizations || {}),
            },
          });
        }
      }

      const apps = await prisma.app.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        select: defaultSelect,
      });

      const resourceOwners = await prisma.resourceOwnerSlug.findMany({
        where: {
          resourceOwnerId: {
            in: apps
              .map((a) => a.organizationId || a.createdById)
              .filter((i) => !!i) as string[],
          },
        },
      });

      return apps.reduce(
        (arr, app) => {
          const resourceOwner = resourceOwners.find(
            (r) =>
              r.resourceOwnerId === (app.organizationId || app.createdById),
          );

          if (resourceOwner) {
            arr.push({ ...app, resourceOwner });
          }
          return arr;
        },
        // prettier-ignore
        [] as (typeof apps[0] & { resourceOwner: ResourceOwnerSlug })[],
      );
    },
  })
  .query('byId', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      const app = await prisma.app.findFirstOrThrow({
        where: {
          id: input.id,
          deletedAt: null,
          OR: [
            { isPrivate: false },
            {
              OR: [
                {
                  editors: {
                    some: { userId: ctx.userId },
                  },
                },
                { organizationId: ctx.orgId },
              ],
            },
          ],
        },
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
          editors: true,
          settings: true,
          connectors: true,
        },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: app.organizationId || app.createdById,
        },
      });

      const canEdit = canUserEdit(app, ctx);
      if (app.isPrivate && !canEdit) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      return { ...app, resourceOwner, canUserEdit: canUserEdit(app, ctx) };
    },
  })
  .query('byResourceOwnerAndAppSlugs', {
    input: z.object({
      resourceOwnerSlug: z.string(),
      appSlug: z.string(),
    }),
    async resolve({ ctx, input }) {
      //find resouce owner (org or user) based on slug
      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          slug: input.resourceOwnerSlug,
        },
      });

      if (!resourceOwner.resourceOwnerId)
        throw new TRPCError({ code: 'NOT_FOUND' });

      // start building the where clause for the app query
      const where: Prisma.AppWhereInput = {
        slug: input.appSlug,
        deletedAt: null,
      };

      // if the resource owner we found above is an organization, add the organization id to the where clause
      if (resourceOwner.resourceOwnerType === ResourceOwnerType.Organization) {
        where.organizationId = resourceOwner.resourceOwnerId;
      }

      // if the resource owner we found above is a user, add the user id to the where clause
      if (resourceOwner.resourceOwnerType === ResourceOwnerType.User) {
        where.createdById = resourceOwner.resourceOwnerId;
      }

      const app = await prisma.app.findFirstOrThrow({
        where,
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
          editors: true,
          settings: true,
          publishedVersion: {
            select: {
              hash: true,
              createdAt: true,
            },
          },
          connectors: {
            select: {
              appId: true,
              type: true,
              isUserAuthRequired: true,
              userScopes: true,
              workspaceScopes: true,
              appConnectorUserAuths: {
                where: {
                  userIdOrTempId:
                    ctx.userId ||
                    (ctx.req?.cookies as any)[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
                },
              },
            },
          },
        },
      });

      const canEdit = canUserEdit(app, ctx);
      if (app.isPrivate && !canEdit)
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      // return the app
      return { ...app, resourceOwner, canUserEdit: canEdit };
    },
  })
  .query('byResourceOwner', {
    input: z.object({
      resourceOwnerSlug: z.string(),
    }),
    async resolve({ input, ctx }) {
      //find resouce owner (org or user) based on slug
      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: {
          slug: input.resourceOwnerSlug,
        },
      });

      if (!resourceOwner) return [];

      if (!resourceOwner.resourceOwnerId) return [];

      const where: Prisma.AppWhereInput = {
        isPrivate: false,
        deletedAt: null,
      };

      if (
        Object.keys(ctx.organizations || {}).includes(
          resourceOwner.resourceOwnerId,
        ) ||
        ctx.userId === resourceOwner.resourceOwnerId
      ) {
        where.isPrivate = undefined;
      }

      if (resourceOwner.resourceOwnerType === ResourceOwnerType.Organization) {
        where.organizationId = resourceOwner.resourceOwnerId;
      } else {
        where.createdById = resourceOwner.resourceOwnerId;
        where.organizationId = null;
      }

      const apps = await prisma.app.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        select: {
          ...defaultSelect,
          scripts: true,
          scriptMain: { include: { script: true } },
          editors: true,
          settings: true,
          connectors: true,
        },
      });

      return apps.map((app) => ({
        ...app,
        resourceOwner,
      }));
    },
  })
  .query('validateSlug', {
    input: z.object({
      slug: z
        .string()
        .min(3)
        .max(50)
        .transform((s) => slugify(s)),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug) return false;

      const existingSlug = await prisma.app.findFirst({
        where: {
          slug: input.slug,
        },
      });

      return !!existingSlug;
    },
  })
  .mutation('boot', {
    input: z.object({
      appId: z.string().uuid(),
      usePublishedVersion: z.boolean().optional(),
    }),
    async resolve({ input, ctx }) {
      const app = await prisma.app.findFirstOrThrow({
        where: { id: input.appId, deletedAt: null },
        include: { scripts: true, scriptMain: true },
      });

      const authToken = await getToken({ req: ctx.req! });

      const token = ctx.userId
        ? generateAccessToken(
            {
              userId: ctx.userId,
              authToken,
            },
            { expiresIn: '30s' },
          )
        : undefined;

      const hash = input.usePublishedVersion
        ? app.publishedVersionHash
        : app.playgroundVersionHash;

      if (!hash) {
        throw new Error('No version hash found');
      }

      const version = getAppVersionFromHash(hash);

      console.log('Boot version: ', version);

      try {
        const bootPayload: Zipper.BootPayload = await fetch(
          getBootUrl(app.slug, version),
          {
            method: 'POST',
            body: '{}',
            headers: {
              authorization: token ? `Bearer ${token}` : '',
            },
          },
        ).then((r) => r.json());

        if (!bootPayload.ok || bootPayload.version !== version) {
          throw new Error(
            `Boot not ok${
              bootPayload.version === version && ': version mismatch'
            }`,
          );
        }

        return bootPayload;
      } catch (e: any) {
        return { ok: false, error: e.toString(), configs: {} };
      }
    },
  })
  .mutation('run', {
    input: z.object({
      appId: z.string().uuid(),
      formData: z.record(z.any()),
      scriptId: z.string().uuid().optional(),
      runId: z.string().uuid(),
      usePublishedVersion: z.boolean().optional(),
    }),
    async resolve({ input, ctx }) {
      const app = await prisma.app.findFirstOrThrow({
        where: { id: input.appId, deletedAt: null },
        include: { scripts: true, scriptMain: true },
      });

      const hash = input.usePublishedVersion
        ? app.publishedVersionHash
        : app.playgroundVersionHash;

      if (!hash) {
        throw new Error('No version hash found');
      }

      const version = getAppVersionFromHash(hash);

      // Find the intended script, or mainScript if we can't find it
      const script =
        app.scripts.find((s) => s.id === input.scriptId) ||
        app.scripts.find((s) => s.id === app.scriptMain?.scriptId);

      if (!script) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

      console.log('---FILENAME---', script.filename);
      const inputParams = parseInputForTypes({ code: script.code });

      if (!inputParams) return { ok: false };

      const inputs = getInputsFromFormData(input.formData, inputParams);

      const authToken = await getToken({ req: ctx.req! });

      const token = ctx.userId
        ? generateAccessToken(
            {
              userId: ctx.userId,
              authToken,
            },
            { expiresIn: '30s' },
          )
        : undefined;

      const result = await fetch(
        getRunUrl(app.slug, version, script.filename),
        {
          method: 'POST',
          body: JSON.stringify(inputs),
          headers: {
            authorization: token ? `Bearer ${token}` : '',
            'x-zipper-run-id': input.runId,
          },
        },
      ).then((r) => r.text());

      return { ok: true, filename: script.filename, version, result };
    },
  })
  .mutation('fork', {
    input: z.object({
      id: z.string().uuid(),
      name: z.string().min(3).max(50),
    }),
    async resolve({ input, ctx }) {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      const { id } = input;

      const app = await prisma.app.findFirstOrThrow({
        where: { id, deletedAt: null },
        include: { scripts: true, scriptMain: true, connectors: true },
      });

      const fork = await prisma.app.create({
        data: {
          slug: slugify(input.name),
          name: input.name,
          description: app.description,
          parentId: app.id,
          organizationId: ctx.orgId,
          createdById: ctx.userId,
          editors: {
            create: {
              userId: ctx.userId,
              isOwner: true,
            },
          },
        },
        select: defaultSelect,
      });

      const forkScripts: Script[] = [];

      await Promise.all(
        app.scripts.map(async (script, i) => {
          const newId = randomUUID();
          const forkScript = await prisma.script.create({
            data: {
              ...script,
              id: newId,
              appId: fork.id,
              order: i,
              hash: getScriptHash({ ...script, id: newId }),
            },
          });

          forkScripts.push(forkScript);

          if (script.id === app.scriptMain?.scriptId) {
            await prisma.scriptMain.create({
              data: {
                app: { connect: { id: fork.id } },
                script: { connect: { id: forkScript.id } },
              },
            });
          }
        }),
      );

      await Promise.all(
        app.connectors.map(async (connector: AppConnector) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          await prisma.appConnector.create({
            data: {
              type: connector.type,
              isUserAuthRequired: connector.isUserAuthRequired,
              metadata: undefined,
              userScopes: connector.userScopes,
              workspaceScopes: connector.workspaceScopes,
              events: connector.events,
              appId: fork.id,
            },
          });
        }),
      );

      const { hash } = await buildAndStoreApplet({
        app: { ...fork, scripts: forkScripts },
        isPublished: true,
        userId: ctx.userId,
      });

      const updatedFork = await prisma.app.update({
        where: {
          id: fork.id,
        },
        data: {
          publishedVersionHash: hash,
          playgroundVersionHash: hash,
        },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: fork.organizationId || fork.createdById,
        },
      });

      return { ...updatedFork, resourceOwner, canUserEdit: true };
    },
  })
  .mutation('edit', {
    input: z.object({
      id: z.string().uuid(),
      data: z.object({
        name: z.string().max(255).optional(),
        slug: z
          .string()
          .min(5)
          .max(60)
          .transform((arg) => slugify(arg))
          .optional(),
        description: z.string().optional().nullable(),
        isPrivate: z.boolean().optional(),
        requiresAuthToRun: z.boolean().optional(),
        isDataSensitive: z.boolean().optional(),
        scripts: z
          .array(
            z.object({
              id: z.string().uuid(),
              data: z.object({
                name: z.string().min(3).max(255).optional(),
                code: z.string().optional(),
                filename: z.string(),
              }),
            }),
          )
          .optional(),
      }),
    }),
    async resolve({ input, ctx }) {
      await hasAppEditPermission({
        ctx,
        appId: input.id,
      });

      const { id, data } = input;
      const { scripts, ...rest } = data;

      // if slug is provided, check if it's valid
      if (data.slug) {
        // is it on the deny list? If so, throw an error
        const deniedSlug = denyList.find((d) => d === data.slug);
        if (deniedSlug)
          throw new TRPCError({
            message: 'Invalid slug',
            code: 'INTERNAL_SERVER_ERROR',
          });
        // is it already being used? If so throw na error
        const existingAppWithSlug = await prisma.app.findFirst({
          where: { slug: data.slug, id: { not: input.id } },
        });
        if (existingAppWithSlug)
          throw new TRPCError({
            message: 'Invalid slug',
            code: 'INTERNAL_SERVER_ERROR',
          });
      }

      const app = await prisma.app.update({
        where: { id },
        data: { updatedAt: new Date(), ...rest },
        include: { scripts: true },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: {
          resourceOwnerId: app.organizationId || app.createdById,
        },
      });

      if (!resourceOwner)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const filenames: Record<string, string> = {};
      app.scripts.map((s) => {
        filenames[s.id] = s.filename;
      });

      const updatedScripts: Script[] = [];
      if (scripts) {
        await Promise.all(
          scripts.map(async (script) => {
            const { id, data } = script;

            let isRunnable: boolean | undefined = undefined;
            if (data.code && endsWithTs(data.filename)) {
              isRunnable = isCodeRunnable(data.code);
            }

            updatedScripts.push(
              await prisma.script.update({
                where: { id },
                data: {
                  ...data,
                  isRunnable,
                  hash: getScriptHash({
                    id,
                    filename: filenames[id]!,
                    code: data.code!,
                  }),
                },
              }),
            );
          }),
        );
      }

      if (input.data.slug || input.data.scripts) {
        const { hash } = await buildAndStoreApplet({
          app: { ...app, scripts: scripts ? updatedScripts : app.scripts },
          userId: ctx.userId,
        });

        // if the code has changed, send the latest code to R2
        if (hash !== app.playgroundVersionHash) {
          const zip = new JSZip();
          (updatedScripts.length > 0 ? updatedScripts : app.scripts).map(
            (s) => {
              zip.file(s.filename, JSON.stringify(s));
            },
          );

          const version = getAppVersionFromHash(hash);

          if (!version) throw new Error('Invalid hash');

          zip.generateAsync({ type: 'uint8array' }).then((content) => {
            storeVersionCode({
              appId: app.id,
              version,
              zip: content,
            });
          });
        }

        const appWithUpdatedHash = await prisma.app.update({
          where: {
            id,
          },
          data: {
            playgroundVersionHash: hash,
          },
          select: defaultSelect,
        });

        return { ...appWithUpdatedHash, resourceOwner };
      }

      return { ...app, resourceOwner };
      // build and store the eszip file
    },
  })
  .mutation('delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({ ctx, appId: input.id });

      await prisma.app.update({
        where: {
          id: input.id,
        },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        id: input.id,
      };
    },
  })
  .mutation('publish', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({ ctx, appId: input.id });

      const app = await prisma.app.findFirstOrThrow({
        where: { id: input.id, deletedAt: null },
        include: { scripts: true },
      });

      const { hash } = await buildAndStoreApplet({ app, isPublished: true });

      await prisma.version.updateMany({
        where: {
          appId: input.id,
          hash: { not: hash },
        },
        data: {
          buildFile: null,
        },
      });

      return prisma.app.update({
        where: {
          id: input.id,
        },
        data: {
          publishedVersionHash: hash,
          playgroundVersionHash: hash,
        },
      });
    },
  });
