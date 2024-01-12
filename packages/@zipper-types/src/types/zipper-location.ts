export enum ZipperLocation {
  ZipperDotRun = 0,
  ZipperDotDev = 1,
}

declare global {
  interface Window {
    ZipperLocation: ZipperLocation;
  }
}
