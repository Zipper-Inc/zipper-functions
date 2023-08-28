export function isZipperImportUrl(specifier: string) {
  try {
    const url = new URL(specifier);
    return [
      'zipper.run',
      'zipper.dev',
      process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_HOST,
      process.env.NEXT_PUBLIC_ZIPPER_DOT_RUN_HOST,
    ].find((host) => host && url.host.endsWith(host))
      ? true
      : false;
  } catch (e) {
    return false;
  }
}
