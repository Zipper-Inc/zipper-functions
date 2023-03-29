import { Handler, HandlerMap } from '../types.ts';
import { MAIN_PATH } from '../constants.ts';
import { main } from '../src/main.ts';

/// <generated-imports>
import * as m0 from '../src/hello.ts';
import * as m1 from '../src/test-storage.ts';
/// </generated-imports>

export const handlers: HandlerMap = {
  [MAIN_PATH]: main as Handler,

  /// <generated-exports>
  'hello.ts': m0.handler as Handler,
  'test-storage.ts': m1.handler as Handler,
  /// </generated-exports>
};
