import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '~/server/prisma';
import { createRouter } from '../createRouter';

const defaultSelect = Prisma.validator<Prisma.UserSelect>()({
  id: true,
  email: true,
  name: true,
  picture: true,
});

export const userRouter = createRouter()
  // read
  .query('bySuperTokenId', {
    input: z.object({
      superTokenId: z.string(),
    }),
    async resolve({ input }) {
      /**
       * For pagination you can have a look at this docs site
       * @link https://trpc.io/docs/useInfiniteQuery
       */

      return prisma.user.findUnique({
        where: {
          superTokenId: input.superTokenId,
        },
        select: defaultSelect,
      });
    },
  });
