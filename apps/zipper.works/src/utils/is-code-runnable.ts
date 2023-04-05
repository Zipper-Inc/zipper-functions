import { parseInputForTypes } from './parse-input-for-types';

export default function isCodeRunnable(code: string) {
  try {
    parseInputForTypes(code, true);

    return true;
  } catch (e) {
    return false;
  }
}
