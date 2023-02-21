import Bowser from 'bowser';

const MAC_OS = 'macOS';
const WINDOWS = 'Windows';
const LINUX = 'Linux';
const IOS = 'iOS';
const ANDROID = 'Android';

let parser: Bowser.Parser.Parser | undefined;

export const getParser = () => {
  parser =
    parser || typeof window !== 'undefined'
      ? Bowser.getParser(window.navigator.userAgent)
      : undefined;
  return parser;
};

export const getOS = () => getParser()?.getOS();
export const getOSName = () => getParser()?.getOSName();
export const isMac = () => getOSName() === MAC_OS;
export const isWindows = () => getOSName() === WINDOWS;
export const isLinux = () => getOSName() === LINUX;
export const isIOS = () => getOSName() === IOS;
export const isAndroid = () => getOSName() === ANDROID;
export const isMobile = () => isIOS() || isAndroid();
export const isApple = () => isMac() || isIOS();
