import { AICodeOutput } from '@zipper/types';
import { z } from 'zod';

const FileWithTsExtension = z.string().refine((value) => value.endsWith('.ts'));

export function groupCodeByFilename(inputs: string): AICodeOutput[] {
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
      if (!FileWithTsExtension.safeParse(file)) {
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
