import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';
import { hasAppEditPermission } from '../utils/authz.utils';

const defaultSelect = Prisma.validator<Prisma.AppConnectorSelect>()({
  id: true,
  type: true,
});

export const appConnectorRouter = createRouter()
  // create
  .mutation('add', {
    input: z.object({
      appId: z.string(),
      type: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      return prisma.appConnector.create({
        data: {
          ...input,
        },
        select: defaultSelect,
      });
    },
  })
  .mutation('update', {
    input: z.object({
      appId: z.string(),
      type: z.string(),
      data: z.object({
        metadata: z.record(z.any()).optional(),
        isUserAuthRequired: z.boolean().optional(),
        userScopes: z.array(z.string()).optional(),
        workspaceScopes: z.array(z.string()).optional(),
        clientId: z.string().optional().nullable(),
        events: z.array(z.string()).optional(),
      }),
    }),
    async resolve({ ctx, input }) {
      const { appId, type, data } = input;
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      return prisma.appConnector.update({
        where: { appId_type: { appId, type } },
        data,
      });
    },
  })
  // delete
  .mutation('delete', {
    input: z.object({
      type: z.string(),
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      await prisma.appConnector.delete({
        where: {
          appId_type: {
            ...input,
          },
        },
      });

      return {
        input,
      };
    },
  });
