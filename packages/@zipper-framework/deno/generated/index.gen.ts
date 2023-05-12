// deno-lint-ignore-file no-explicit-any

import { MAIN_PATH } from '../constants.ts';
import * as main from '../src/main.ts';

/// <generated-imports>
/// 🛑 DO NOT MODIFY THIS PART ///
import * as module0 from '../src/test-storage.ts';
import * as module1 from '../src/hello.ts';
/// </generated-imports> ///

export const files: {
  [key: string]: {
    handler?: Zipper.Handler<any>;
    config?: Zipper.HandlerConfig<any>;
  };
} = {
  [MAIN_PATH]: main,
  /// <generated-exports>
  /// 🛑 DO NOT MODIFY THIS PART ///
  'test-storage.ts': module0,
  'hello.ts': module1,
  /// </generated-exports>
};
