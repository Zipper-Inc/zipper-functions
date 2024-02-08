export const sanitizer = {
  filename: (filename: string) => {
    if (filename.length < 3) {
      throw new Error('Invalid File name: filenames must be at least 4 chars.');
    }
    
    if (!['.ts', '.md'].includes(filename.slice(-3)) && filename.includes('.')) {
      throw new Error('Invalid File extension: only .ts and .md files allowed.');
    }

    if (['.ts', '.md'].includes(filename.slice(-3))){
      return filename
    }

    return filename + '.ts'
  },
};
