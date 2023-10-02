export const extslist = {
  md: 'markdown',
  ts: 'typescript',
  json: 'json',
};

type Extensions = keyof typeof extslist;

export function getExtensionFromFilename(filename: string): Extensions {
  return filename.split('.').pop() as Extensions;
}
