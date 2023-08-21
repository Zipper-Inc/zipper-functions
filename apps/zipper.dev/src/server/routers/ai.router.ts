import { AICodeOutput } from '@zipper/types';
import { z } from 'zod';
import { createCodeChain } from '~/utils/ai-generate-applet';
import { createRouter } from '../createRouter';

export const aiRouter = createRouter()
  // Applet pipeline
  .mutation('pipeline', {
    input: z.object({
      userRequest: z.string(),
    }),
    async resolve({ input }) {
      const { userRequest } = input;

      try {
        const { output } = await createCodeChain.call({ userRequest });
        return output as AICodeOutput[];
      } catch (err) {
        throw new Error(`Error while running the AI pipeline: ${err}`);
      }
    },
  });
