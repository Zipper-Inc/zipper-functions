import { z } from 'zod';

export const getFileExtension = (filename: string) => {
  if (!filename.includes('.')) return;
  return filename.split('.').pop();
};

export const removeExtension = (filename: string) => {
  if (!getFileExtension(filename)) return filename;
  return filename.split('.').slice(0, -1).join('.');
};
export const RunnableExtensionSchema = z.enum(['ts', 'tsx']);

type RunnableExtension = z.infer<typeof RunnableExtensionSchema>;

export const isRunnableExtension = (
  extension: string,
): extension is RunnableExtension => {
  return RunnableExtensionSchema.safeParse(extension).success;
};
