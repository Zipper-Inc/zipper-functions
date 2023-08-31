export const getEditAppletLink = (
  resourceOwnerSlug: string,
  appletSlug: string,
  filename = 'main.ts',
) => `/${resourceOwnerSlug}/${appletSlug}/src/${filename}`;
