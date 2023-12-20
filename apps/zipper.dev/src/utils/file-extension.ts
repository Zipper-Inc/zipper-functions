import { z } from 'zod';

export const RunnableExtensionSchema = z.enum(['ts', 'tsx']);

export const getFileExtension = (filename: string) => {
  return filename.split('.').pop();
};
