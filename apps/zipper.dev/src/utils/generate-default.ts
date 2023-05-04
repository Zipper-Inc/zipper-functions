import { generateSlug } from 'random-word-slugs';

export const generateDefaultSlug = () => generateSlug(3, { format: 'kebab' });

export const generateDefaultName = () => generateSlug(3, { format: 'title' });
