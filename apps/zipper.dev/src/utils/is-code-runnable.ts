import { hasHandler } from './parse-code';

export function isCodeRunnable(code: string) {
  return hasHandler({ code });
}
