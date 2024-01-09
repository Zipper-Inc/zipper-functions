export const getFileExtension = (filename: string) => {
  return filename.split('.').pop();
};

export const removeExtension = (filename: string) => {
  return filename.split('.').slice(0, -1).join('.');
};
