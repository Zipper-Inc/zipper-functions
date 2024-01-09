import { z } from 'zod';

export const RunnableExtensionSchema = z.enum(['ts', 'tsx']);
