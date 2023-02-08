import generate from 'project-name-generator';

export const generateDefaultSlug = () => generate({ words: 3 }).dashed;

export const generateDefaultName = () => generate({ words: 3 }).spaced;
