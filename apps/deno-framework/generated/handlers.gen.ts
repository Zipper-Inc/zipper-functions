import { Handler, HandlerMap } from '../types.ts';
import { MAIN_PATH } from '../constants.ts';
import { main } from '../src/main.ts';

/// <generated-imports> DO NOT MODIFY MANUALLY
import * as m0 from '../src/test-storage.ts';
import * as m1 from '../src/hello.ts';
/// </generated-imports>

export const handlers: HandlerMap = {
  [MAIN_PATH]: main as Handler,

  /// <generated-exports> DO NOT MODIFY MANUALLY
  'test-storage.ts': m0.handler as Handler,
  'hello.ts': m1.handler as Handler,
  /// </generated-exports>
};
