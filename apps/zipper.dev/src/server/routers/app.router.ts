import {
  App,
  AppConnector,
  AppEditor,
  Prisma,
  ResourceOwnerSlug,
  Script,
  ScriptMain,
} from '@prisma/client';
import { TRPCError } from '@trpc/server';
import {
  appSubmissionState,
  BootPayload,
  ResourceOwnerType,
} from '@zipper/types';
import {
  getInputsFromFormData,
  __ZIPPER_TEMP_USER_ID,
  cacheDeployment,
  cacheBootPayload,
} from '@zipper/utils';
import { randomUUID } from 'crypto';
import JSZip from 'jszip';
import fetch from 'node-fetch';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { trackEvent } from '~/utils/api-analytics';
import { processSchedulesInBootpayload } from '~/utils/boot-info-utils';
import { buildAndStoreApplet } from '~/utils/eszip-build-applet';
import { generateDefaultSlug } from '~/utils/generate-default';
import getRunUrl, { getBootUrl } from '~/utils/get-run-url';
import { AppletAuthorReturnType } from '~/utils/get-user-info';
import { getAppVersionFromHash, getScriptHash } from '~/utils/hashing';
import { isCodeRunnable } from '~/utils/is-code-runnable';
import { generateAccessToken } from '~/utils/jwt-utils';
import {
  createProject,
  endsWithTs,
  parseInputForTypes,
} from '~/utils/parse-code';
import slugify from '~/utils/slugify';
import { Context } from '../context';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../root';
import {
  hasAppEditPermission,
  hasAppReadPermission,
} from '../utils/authz.utils';
import { storeVersionCode } from '../utils/r2.utils';
import denyList from '../utils/slugDenyList';
import { DEFAULT_MD } from './script.router';

const defaultSelect = Prisma.validator<Prisma.AppSelect>()({
  id: true,
  createdAt: true,
  createdById: true,
  description: true,
  isAutoPublished: true,
  isDataSensitive: true,
  isPrivate: true,
  name: true,
  organizationId: true,
  parentId: true,
  playgroundVersionHash: true,
  publishedVersionHash: true,
  requiresAuthToRun: true,
  secretsHash: true,
  slug: true,
  submissionState: true,
  updatedAt: true,
});

export const defaultCode = [
  'export async function handler({worldString}: {worldString: string}) {',
  '  return `Hello ${worldString}`;',
  '}',
].join('\n');

const defaultMainFile = 'main';
const defaultMainFilename = `${defaultMainFile}.ts`;

const ZIPPER_PLAYGROUND_USER_AGENT_HEADER = {
  'user-agent': 'ZipperPlayground/0.1',
};

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

export const appRouter = createTRPCRouter({
  add: protectedProcedure
    .input(
      z
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
    )
    .mutation(
      async ({
        input = { name: undefined, slug: undefined, description: undefined },
        ctx,
      }) => {
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

        if (organizationId) {
          const isMember = await prisma.organizationMembership.count({
            where: { organizationId, userId: ctx.userId },
          });

          if (!isMember) throw new TRPCError({ code: 'UNAUTHORIZED' });
        }

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
          appId: app.id,
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
          where: { resourceOwnerId: app.organizationId ?? app.createdById },
        });

        trackEvent({
          userId: ctx.userId,
          orgId: ctx.orgId,
          eventName: 'Created Applet',
          properties: {
            appletId: app.id,
            slug: app.slug,
            usedAI: !!aiCode,
          },
        });

        await cacheDeployment.set(app.slug, { appId: app.id, version: hash });

        return { ...app, scriptMain, resourceOwner };
      },
    ),
  templates: publicProcedure.query(async () => {
    const apps = await prisma.app.findMany({
      where: {
        isTemplate: true,
        deletedAt: null,
      },
      select: defaultSelect,
    });

    return apps;
  }),
  allApproved: publicProcedure
    .input(
      z
        .object({
          amount: z.number(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
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

      return apps
        .reduce(
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
        )
        .slice(0, input?.amount ?? apps.length + 1);
    }),
  byAuthedUser: protectedProcedure
    .input(
      z
        .object({
          parentId: z.string().optional(),
          filterByOrganization: z.boolean().default(true),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
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
    }),
  byId: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
    }),
  byResourceOwnerAndAppSlugs: publicProcedure
    .input(
      z.object({
        resourceOwnerSlug: z.string().toLowerCase(),
        appSlug: z.string().toLowerCase(),
      }),
    )
    .query(async ({ ctx, input }) => {
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
                    (ctx.req?.cookies as any)[__ZIPPER_TEMP_USER_ID],
                },
              },
            },
          },
        },
      });

      const appAuthor: AppletAuthorReturnType = {
        name: '',
        organization: '',
        image: '',
        orgImage: '',
      };

      const authorName = await prisma.user.findUnique({
        where: {
          id: resourceOwner.resourceOwnerId,
        },
        include: {
          organizationMemberships: true,
        },
      });

      if (app.organizationId) {
        const authorOrg = await prisma.organization.findUnique({
          where: {
            id: app.organizationId,
          },
        });
        appAuthor.organization = authorOrg?.name || '';
      }

      appAuthor.name = authorName?.name || '';
      appAuthor.image = authorName?.image || '';

      const canEdit = canUserEdit(app, ctx);
      if (app.isPrivate && !canEdit)
        throw new TRPCError({ code: 'UNAUTHORIZED' });
      // return the app
      return { ...app, resourceOwner, canUserEdit: canEdit, appAuthor };
    }),
  byResourceOwner: publicProcedure
    .input(
      z.object({
        resourceOwnerSlug: z.string().toLowerCase(),
      }),
    )
    .query(async ({ input, ctx }) => {
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
    }),
  validateSlug: protectedProcedure
    .input(
      z.object({
        slug: z
          .string()
          .min(3)
          .max(50)
          .transform((s) => slugify(s)),
      }),
    )
    .query(async ({ input }) => {
      const deniedSlug = denyList.find((d) => d === input.slug);
      if (deniedSlug) return false;

      const existingSlug = await prisma.app.findFirst({
        where: {
          slug: input.slug,
        },
      });

      return !!existingSlug;
    }),
  boot: publicProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        usePublishedVersion: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const app = await prisma.app.findFirstOrThrow({
        where: { id: input.appId, deletedAt: null },
        include: { scripts: true, scriptMain: true },
      });

      await hasAppReadPermission({ ctx, appId: input.appId });

      const token = ctx.userId
        ? generateAccessToken(
            {
              userId: ctx.userId,
              session: ctx.session,
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
        const bootPayload: BootPayload = await fetch(
          getBootUrl(app.slug, version),
          {
            method: 'POST',
            body: '{}',
            headers: {
              authorization: token ? `Bearer ${token}` : '',
              'x-zipper-host': `${app.slug}.zipper.run`,
              ...ZIPPER_PLAYGROUND_USER_AGENT_HEADER,
            },
          },
        )
          .then((r) => r.json())
          .catch((e) => {
            console.error(e);
            throw new Error(e);
          });

        if (!bootPayload.ok || bootPayload.version !== version) {
          throw new Error(
            `Boot not ok${
              bootPayload.version !== version && ': version mismatch'
            }`,
          );
        }

        await processSchedulesInBootpayload(bootPayload, app, ctx.userId);

        await cacheBootPayload.set(
          { deploymentId: bootPayload.deploymentId },
          bootPayload,
        );

        return bootPayload;
      } catch (e: any) {
        console.error(e);
        return { ok: false, error: e.toString(), configs: {} };
      }
    }),
  run: publicProcedure
    .input(
      z.object({
        appId: z.string().uuid(),
        formData: z.record(z.any()),
        scriptId: z.string().uuid().optional(),
        runId: z.string().uuid(),
        usePublishedVersion: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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
      const project = createProject(
        app.scripts.reduce<Record<string, string>>((modules, script) => {
          modules[script.filename] = script.code;
          return modules;
        }, {}),
      );
      const inputParams = await parseInputForTypes({
        handlerFile: script.filename,
        project,
      });

      if (!inputParams) return { ok: false };

      const inputs = getInputsFromFormData(input.formData, inputParams);

      const token = ctx.userId
        ? generateAccessToken(
            {
              userId: ctx.userId,
              session: ctx.session,
            },
            { expiresIn: '30s' },
          )
        : undefined;

      const res = await fetch(getRunUrl(app.slug, version, script.filename), {
        method: 'POST',
        body: JSON.stringify(inputs),
        headers: {
          authorization: token ? `Bearer ${token}` : '',
          'x-zipper-run-id': input.runId,
          'x-zipper-host': `${app.slug}.zipper.run`,
          ...ZIPPER_PLAYGROUND_USER_AGENT_HEADER,
        },
      });

      const result = await res.text();

      trackEvent({
        userId: ctx.userId,
        orgId: ctx.orgId,
        eventName: 'Ran Applet',
        properties: {
          slug: app.slug,
          appletId: app.id,
          status: res.status,
          runId: input.runId,
          script: script.name,
        },
      });

      return { ok: true, filename: script.filename, version, result };
    }),
  fork: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(3).max(50),
        organizationId: z.string().uuid().optional(),
        connectToParent: z.boolean().optional().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { id, name, connectToParent, organizationId } = input;
      if (
        organizationId &&
        !Object.keys(ctx.organizations || {}).includes(organizationId)
      ) {
        throw new Error('Invalid organizationId');
      }

      const { fork, updatedFork } = await forkAppletById({
        appId: id,
        name,
        connectToParent,
        userId: ctx.userId,
        orgId: organizationId || ctx.orgId,
      });

      const resourceOwner = await prisma.resourceOwnerSlug.findFirstOrThrow({
        where: {
          resourceOwnerId: fork.organizationId || fork.createdById,
        },
      });

      trackEvent({
        userId: ctx.userId,
        orgId: ctx.orgId,
        eventName: 'Forked Applet',
        properties: {
          appletId: updatedFork.id,
          slug: updatedFork.slug,
          isTemplate: !connectToParent,
        },
      });

      return { ...updatedFork, resourceOwner, canUserEdit: true };
    }),
  edit: publicProcedure
    .input(
      z.object({
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
          isAutoPublished: z.boolean().optional(),
          scripts: z
            .array(
              z.object({
                id: z.string().uuid(),
                data: z.object({
                  name: z.string().min(1).max(255).optional(),
                  code: z.string().optional(),
                  filename: z.string(),
                }),
              }),
            )
            .optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
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

      const updatedScripts = !scripts
        ? app.scripts
        : await Promise.all(
            scripts.map(async (script) => {
              const { id, data } = script;

              let isRunnable: boolean | undefined = undefined;
              if (data.code && endsWithTs(data.filename)) {
                isRunnable = isCodeRunnable(data.code);
              }

              return prisma.script.update({
                where: { id },
                data: {
                  ...data,
                  isRunnable,
                  hash: getScriptHash({
                    appId: app.id,
                    filename: filenames[id]!,
                    code: data.code!,
                  }),
                },
              });
            }),
          );

      if (input.data.slug || input.data.scripts) {
        const appWithUpdatedHash = await buildAndStoreNewAppVersion(id, {
          app,
          scripts: updatedScripts,
          userId: ctx.userId,
        });
        return { ...appWithUpdatedHash, resourceOwner };
      }

      return { ...app, resourceOwner };
    }),
  delete: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
  publish: publicProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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

      trackEvent({
        userId: ctx.userId,
        orgId: ctx.orgId,
        eventName: 'Published Applet',
        properties: {
          slug: app.slug,
          appletId: app.id,
        },
      });

      await cacheDeployment.set(app.slug, { appId: app.id, version: hash });

      return prisma.app.update({
        where: {
          id: input.id,
        },
        data: {
          publishedVersionHash: hash,
          playgroundVersionHash: hash,
        },
      });
    }),
});

export async function buildAndStoreNewAppVersion(
  id: string,
  {
    app: appPassedIn,
    scripts: scriptsPassedIn,
    userId,
  }: {
    app?: App & { scripts: Script[] };
    scripts?: Script[];
    userId?: string;
  },
) {
  const app =
    appPassedIn ||
    (await prisma.app.findFirstOrThrow({
      where: { id },
      include: { scripts: true },
    }));

  const scripts = scriptsPassedIn || app.scripts;

  const { hash } = await buildAndStoreApplet({
    app: { ...app, scripts },
    userId,
    isPublished: app.isAutoPublished,
  });

  // if the code has changed, send the latest code to R2
  if (hash !== app.playgroundVersionHash) {
    const zip = new JSZip();
    (scripts.length > 0 ? scripts : app.scripts).map((s) => {
      zip.file(s.filename, JSON.stringify(s));
    });

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

  const appHashUpdateData: any = {
    playgroundVersionHash: hash,
  };

  if (app.isAutoPublished) {
    appHashUpdateData.publishedVersionHash = hash;
  }

  const appWithUpdatedHash = await prisma.app.update({
    where: {
      id,
    },
    data: appHashUpdateData,
    select: defaultSelect,
  });

  const {
    slug: subdomain,
    id: appId,
    playgroundVersionHash: version,
  } = appWithUpdatedHash;

  await cacheDeployment.set(subdomain, {
    appId,
    version: version as string,
  });

  return { ...appWithUpdatedHash };
}

async function forkAppletById(inputs: {
  appId: string;
  name: string;
  connectToParent: boolean;
  userId: string;
  orgId?: string;
}) {
  const app = await prisma.app.findFirstOrThrow({
    where: { id: inputs.appId, deletedAt: null },
    include: { scripts: true, scriptMain: true, connectors: true },
  });

  return forkApplet({ app, ...inputs });
}

export async function forkAppletBySlug(inputs: {
  appSlug: string;
  name: string;
  connectToParent: boolean;
  userId: string;
  orgId?: string;
}) {
  const app = await prisma.app.findFirstOrThrow({
    where: { slug: inputs.appSlug, deletedAt: null },
    include: { scripts: true, scriptMain: true, connectors: true },
  });

  return forkApplet({ app, ...inputs });
}

async function forkApplet({
  app,
  name,
  connectToParent,
  userId,
  orgId,
}: {
  app: App & {
    scripts: Script[];
    scriptMain: ScriptMain | null;
    connectors: AppConnector[];
  };
  name: string;
  connectToParent: boolean;
  userId: string;
  orgId?: string;
}) {
  const fork = await prisma.app.create({
    data: {
      slug: slugify(name),
      name: name,
      description: `Fork of ${app.name || app.slug}${
        app.description ? `: ${app.description}` : ''
      }`,
      parentId: connectToParent ? app.id : undefined,
      organizationId: orgId,
      createdById: userId,
      editors: {
        create: {
          userId: userId,
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
          hash: getScriptHash({ ...script, appId: fork.id }),
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
    userId: userId,
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
  return { fork, updatedFork };
}
