export const sanitizer = {
  filename: (filename: string) => {
    if (
      !['.ts', '.md'].includes(filename.slice(-3)) &&
      filename.includes('.')
    ) {
      throw new Error(
        'Invalid File extension: only .ts and .md files allowed.',
      );
    }

    if (['.ts', '.md'].includes(filename.slice(-3))) {
      return filename;
    }

    return filename + '.ts';
  },
};
