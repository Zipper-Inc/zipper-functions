export enum ZipperLocation {
  ZipperDotRun,
  ZipperDotDev,
}

declare global {
  interface Window {
    ZipperLocation: ZipperLocation;
  }
}
