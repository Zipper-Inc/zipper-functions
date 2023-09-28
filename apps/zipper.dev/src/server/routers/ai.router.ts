import { AICodeOutput } from '@zipper/types';
import { z } from 'zod';
import { createCodeChain } from '~/utils/ai-generate-applet';
import { createTRPCRouter, publicProcedure } from '../root';

export const aiRouter = createTRPCRouter({
  pipeline: publicProcedure
    .input(
      z.object({
        userRequest: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const { userRequest } = input;

      try {
        const { output } = await createCodeChain.call({ userRequest });
        return output as AICodeOutput[];
      } catch (err) {
        throw new Error(`Error while running the AI pipeline: ${err}`);
      }
    }),
});
