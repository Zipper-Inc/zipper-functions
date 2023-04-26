import { parseInputForTypes } from './parse-code';

export default function isCodeRunnable(code: string) {
  try {
    return !!parseInputForTypes({ code: code, throwErrors: true });
  } catch (e) {
    return false;
  }
}
