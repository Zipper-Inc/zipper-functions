import Bowser from 'bowser';

export const hasBrowserLikeUserAgent = (headers: Headers) => {
  const parser = Bowser.getParser(headers.get('user-agent') || '');
  return !!(
    parser.getBrowserName() &&
    parser.getEngineName() &&
    parser.getOSName()
  );
};
