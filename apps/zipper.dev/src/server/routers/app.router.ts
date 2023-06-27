import {
  App,
  AppEditor,
  Branch,
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
import {
  getAppHash,
  getAppVersionFromHash,
  getScriptHash,
} from '~/utils/hashing';
import { parseInputForTypes } from '~/utils/parse-code';
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

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  name: true,
  slug: true,
  description: true,
  isPrivate: true,
  lastDeploymentVersion: true,
  parentId: true,
  submissionState: true,
  createdAt: true,
  updatedAt: true,
  organizationId: true,
  createdById: true,
  requiresAuthToRun: true,
  hash: true,
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
  // create
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

      const scriptMain = await prisma.script.create({
        data: {
          branch: {
            create: {
              name: 'main',
              appId: app.id,
            },
          },
          code: defaultCode,
          name: defaultMainFile,
          filename: defaultMainFilename,
          isRunnable: true,
          order: 0,
        },
      });
      // get a hash of main script and update the script
      const scriptHash = getScriptHash({
        code: defaultCode,
        filename: defaultMainFilename,
        id: scriptMain.id,
      });
      await prisma.script.update({
        where: {
          id: scriptMain.id,
        },
        data: {
          hash: scriptHash,
        },
      });

      // get a hash of app and update the app
      const appHash = getAppHash({
        app,
        scripts: [{ id: scriptMain.id, hash: scriptHash }],
      });
      const appVersion = getAppVersionFromHash(appHash);
      await prisma.app.update({
        where: {
          id: app.id,
        },
        data: {
          hash: appHash,
          lastDeploymentVersion: appVersion,
        },
      });

      return { ...app };
    },
  })
  // read
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
      branchName: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      const app = await prisma.app.findFirstOrThrow({
        where: {
          id: input.id,
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
          branches: {
            where: {
              name: input.branchName || 'main',
            },
            include: {
              scripts: true,
            },
          },
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
      branchName: z.string().optional(),
    }),
    async resolve({ ctx, input }) {
      //find resouce owner (org or user) based on slug
      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          slug: input.resourceOwnerSlug,
        },
      });

      // start building the where clause for the app query
      const where: Prisma.AppWhereInput = {
        slug: input.appSlug,
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
          branches: {
            where: {
              name: input.branchName || 'main',
            },
            include: {
              scripts: true,
            },
          },
          editors: true,
          settings: true,
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
      return {
        ...app,
        scripts: app.branches.map((b) => b.scripts).flat(),
        resourceOwner,
        canUserEdit: canEdit,
      };
    },
  })
  .query('byResourceOwner', {
    input: z.object({
      resourceOwnerSlug: z.string(),
      branchName: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
      //find resouce owner (org or user) based on slug
      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: {
          slug: input.resourceOwnerSlug,
        },
      });

      if (!resourceOwner) return undefined;

      if (!resourceOwner.resourceOwnerId) return [];

      const where: Prisma.AppWhereInput = {
        isPrivate: false,
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
          branches: {
            where: {
              name: input.branchName || 'main',
            },
            include: {
              scripts: true,
            },
          },
          editors: true,
          settings: true,
          connectors: true,
        },
      });

      return apps.map((app) => ({
        ...app,
        scripts: app.branches.map((b) => b.scripts).flat(),
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
      branchName: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
      const app = await prisma.app.findFirstOrThrow({
        where: { id: input.appId },
        include: {
          branches: {
            where: {
              name: input.branchName || 'main',
            },
            include: {
              scripts: true,
            },
          },
        },
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
      const version = getAppVersionFromHash(
        app.hash ||
          getAppHash({ app, scripts: app.branches[0]?.scripts || [] }),
      );

      console.log('Boot version: ', version);

      try {
        const bootPayload: Zipper.BootPayload = await fetch(
          getBootUrl(app.slug, version),
          {
            method: 'POST',
            body: '{}',
            headers: {
              authorization: token ? `Bearer ${token}` : '',
              'x-zipper-branch-override': 'main',
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

        await prisma.app.update({
          where: { id: app.id },
          data: {
            lastDeploymentVersion: version,
          },
        });

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
      branchName: z.string().optional(),
    }),
    async resolve({ input, ctx }) {
      const app: App & { branches: (Branch & { scripts: Script[] })[] } =
        await prisma.app.findFirstOrThrow({
          where: { id: input.appId },
          include: {
            branches: {
              where: {
                name: input.branchName || 'main',
              },
              include: {
                scripts: true,
              },
            },
          },
        });

      const version = getAppVersionFromHash(
        app.hash ||
          getAppHash({ app, scripts: app.branches[0]?.scripts || [] }),
      );

      console.log('Run version: ', version);

      // Find the intended script, or mainScript if we can't find it
      const script = app.branches[0]?.scripts.find(
        (s) => s.id === input.scriptId || s.filename === 'main.ts',
      );

      if (!script) {
        throw new TRPCError({ code: 'NOT_FOUND' });
      }

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
            'x-zipper-branch-override': 'main',
          },
        },
      ).then((r) => r.text());

      await prisma.app.update({
        where: { id: app.id },
        data: {
          lastDeploymentVersion: version,
        },
      });

      return { ok: true, filename: script.filename, version, result };
    },
  })
  // update
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
        where: { id },
        include: {
          branches: {
            where: {
              name: 'main',
            },
            include: {
              scripts: true,
            },
          },
        },
      });

      const fork = await prisma.app.create({
        data: {
          slug: slugify(input.name),
          name: input.name,
          description: app.description,
          parentId: app.id,
          organizationId: ctx.orgId,
          createdById: ctx.userId,
          branches: {
            create: {
              name: 'main',
            },
          },
          editors: {
            create: {
              userId: ctx.userId,
              isOwner: true,
            },
          },
        },
        include: {
          branches: true,
        },
      });

      const forkBranchId = fork.branches[0]!.id;

      const forkScripts: Script[] = [];

      await Promise.all(
        (app.branches[0]?.scripts || []).map(async (script, i) => {
          const newId = randomUUID();
          const forkScript = await prisma.script.create({
            data: {
              ...script,
              id: newId,
              inputSchema: JSON.stringify(script.inputSchema),
              outputSchema: JSON.stringify(script.outputSchema),
              branchId: forkBranchId,
              order: i,
              hash: getScriptHash({ ...script, id: newId }),
            },
          });

          forkScripts.push(forkScript);
        }),
      );

      const appHash = getAppHash({
        app: {
          id: fork.id,
          name: fork.name,
        },
        scripts: forkScripts,
      });

      const appWithScripts = await prisma.app.update({
        where: { id: fork.id },
        data: {
          hash: appHash,
        },
        select: defaultSelect,
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: fork.organizationId || fork.createdById,
        },
      });

      return { ...appWithScripts, resourceOwner, canUserEdit: true };
    },
  })
  // update
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
        lastDeploymentVersion: z.string().optional(),
        requiresAuthToRun: z.boolean().optional(),
        branch: z
          .object({
            name: z.string().optional(),
            scripts: z.array(
              z.object({
                id: z.string().uuid(),
                data: z.object({
                  name: z.string().min(3).max(255).optional(),
                  description: z.string().optional().nullable(),
                  code: z.string().optional(),
                }),
              }),
            ),
          })
          .optional(),
      }),
    }),
    async resolve({ input, ctx }) {
      await hasAppEditPermission({
        ctx,
        appId: input.id,
      });

      const { id, data } = input;
      const { branch, ...rest } = data;

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
        include: { branches: { include: { scripts: true } } },
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirst({
        where: {
          resourceOwnerId: app.organizationId || app.createdById,
        },
      });

      if (!resourceOwner)
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR' });

      const filenames: Record<string, string> = {};
      app.branches
        .map((b) => b.scripts)
        .flat()
        .map((s) => {
          filenames[s.id] = s.filename;
        });

      const updatedScripts: Script[] = [];
      if (branch?.scripts) {
        await Promise.all(
          branch.scripts.map(async (script) => {
            const { id, data } = script;
            let isRunnable: boolean | undefined = undefined;
            if (data.code) {
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

      const appWithUpdatedHash = await prisma.app.update({
        where: {
          id,
        },
        data: {
          hash: getAppHash({
            app: { id: app.id, name: app.name },

            scripts: updatedScripts,
          }),
        },
        select: defaultSelect,
      });

      return { ...appWithUpdatedHash, resourceOwner };
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      id: z.string(),
    }),
    async resolve({ ctx, input }) {
      if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      }

      await prisma.app.deleteMany({
        where: {
          id: input.id,
          editors: { some: { userId: ctx.userId } },
        },
      });

      return {
        id: input.id,
      };
    },
  });
