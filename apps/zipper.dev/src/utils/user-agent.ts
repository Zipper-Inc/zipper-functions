import type { NextRequest } from 'next/server';
import Bowser from 'bowser';

export const hasBrowserLikeUserAgent = (req: NextRequest) => {
  const parser = Bowser.getParser(req.headers.get('user-agent') || '');
  return !!(
    parser.getBrowserName() &&
    parser.getEngineName() &&
    parser.getOSName()
  );
};
