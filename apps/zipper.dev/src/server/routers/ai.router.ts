import { z } from 'zod';
import { createCodeChain, parseCodeOutput } from '~/utils/ai-generate-applet';
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
        const { auditedCode } = await createCodeChain.call({ userRequest });
        const generatedCode = parseCodeOutput(auditedCode);
        return generatedCode;
      } catch (err) {
        throw new Error(`Error while running the AI pipeline: ${err}`);
      }
    },
  });
