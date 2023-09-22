import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';

import { hasAppEditPermission } from '../utils/authz.utils';
import { createTRPCRouter, publicProcedure } from '../root';

const defaultSelect = Prisma.validator<Prisma.AppConnectorSelect>()({
  id: true,
  type: true,
});

export const appConnectorRouter = createTRPCRouter({
  add: publicProcedure
    .input(
      z.object({
        appId: z.string(),
        type: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
  update: publicProcedure
    .input(
      z.object({
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
    )
    .mutation(async ({ ctx, input }) => {
      const { appId, type, data } = input;
      await hasAppEditPermission({
        ctx,
        appId: input.appId,
      });

      return prisma.appConnector.update({
        where: { appId_type: { appId, type } },
        data,
      });
    }),
  delete: publicProcedure
    .input(
      z.object({
        type: z.string(),
        appId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
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
    }),
});
