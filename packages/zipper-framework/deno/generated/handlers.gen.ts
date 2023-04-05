import { Handler, HandlerMap } from '../types.d.ts';
import { MAIN_PATH } from '../constants.ts';
import { handler as main } from '../src/main.ts';

/// <generated-imports>
/// 🛑 DO NOT MODIFY THIS PART ///
import * as m0 from '../src/test-storage.ts';
import * as m1 from '../src/hello.ts';
/// </generated-imports> ///

export const handlers: HandlerMap = {
  [MAIN_PATH]: main as Handler,

  /// <generated-exports>
  /// 🛑 DO NOT MODIFY THIS PART ///
  'test-storage.ts': m0.handler as Handler,
  'hello.ts': m1.handler as Handler,
  /// </generated-exports>
};
