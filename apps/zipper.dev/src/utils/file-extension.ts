import { z } from 'zod';

export const RunnableExtensionSchema = z.enum(['ts', 'tsx']);

export const allowedExtensionsWithDot: AllowedExtensionWithDot[] = [
  '.ts',
  '.tsx',
  '.md',
];

export const AllowedExtensionSchema = z.enum(['ts', 'tsx', 'md']);

export type RunnableExtension = z.infer<typeof RunnableExtensionSchema>;
export type AllowedExtension = z.infer<typeof AllowedExtensionSchema>;
export type AllowedExtensionWithDot = `.${AllowedExtension}`;

export const getFileExtension = (filename: string) => {
  const extension = filename.split('.').pop();
  return AllowedExtensionSchema.parse(extension);
};
