import { AICodeOutput } from '@zipper/types';
import { useChat } from 'ai/react';
import { useCallback } from 'react';
import { z } from 'zod';

export const useAI = () => {
  const { append, isLoading } = useChat({
    api: '/api/ai/functions',
  });

  const generateCode = useCallback(async (userRequest: string) => {
    const gptOutput = await append({ role: 'user', content: userRequest });
    if (!gptOutput) {
      console.error('No code returned from AI');
      return;
    }
    const code = grabCodeInsideBackticks(gptOutput);
    console.log('Code', code);

    return { groupedByFilename: groupCodeByFilename(code), raw: code };
  }, []);

  return {
    generateCode,
    isLoading,
  };
};

const fileWithTsExtensionSchema = z
  .string()
  .refine((value) => value.endsWith('.ts'));

function groupCodeByFilename(inputs: string): AICodeOutput[] {
  const output: AICodeOutput[] = [];
  const lines = inputs.split('\n');

  let currentFilename: AICodeOutput['filename'] = 'main.ts';
  let currentCode = '';

  for (const line of lines) {
    if (line.trim().startsWith('// file:')) {
      if (currentCode !== '') {
        output.push({ filename: currentFilename, code: currentCode });
        currentCode = '';
      }
      let file = line.trim().replace('// file:', '').trim();
      if (!fileWithTsExtensionSchema.safeParse(file)) {
        file += '.ts';
      }
      currentFilename = file as AICodeOutput['filename'];
    } else {
      currentCode += line + '\n';
    }
  }

  // Add the last code block
  if (currentCode !== '') {
    output.push({ filename: currentFilename, code: currentCode });
  }

  return output;
}

function grabCodeInsideBackticks(raw: string) {
  const lines = raw.split('\n');
  const firstBacktickLine = lines.findIndex((line) => line.startsWith('```'));
  const lastBacktickLine = lines.lastIndexOf('```');
  const code = lines.slice(firstBacktickLine + 1, lastBacktickLine).join('\n');
  return code;
}
