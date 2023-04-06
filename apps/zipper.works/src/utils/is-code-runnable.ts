import { parseInputForTypes } from './parse-code';

export default function isCodeRunnable(code: string) {
  try {
    parseInputForTypes({ code: code, throwErrors: true });

    return true;
  } catch (e) {
    return false;
  }
}
