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
        superTokenId: ctx.superTokenId,
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
  // delete
  .mutation('delete', {
    input: z.object({
      type: z.string(),
      appId: z.string(),
    }),
    async resolve({ ctx, input }) {
      await hasAppEditPermission({
        superTokenId: ctx.superTokenId,
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
