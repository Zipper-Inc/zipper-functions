import { parseAppletPath } from './parse-applet-path';

const ACTION = 'actionName';
const VERSION = 'a1b2c3d';

type TestCase = [
  /** description of test case */
  string,
  /** input: path to parse */
  string,
  /** output: expected results */
  {
    filename: string;
    version?: string | undefined;
    action?: string | undefined;
  },
];

type TestBuilder = (testCase: TestCase) => TestCase;

const addVersionToPath: TestBuilder = ([description, input, output]) => [
  `${description} at specifc version`,
  `@${VERSION}/${input}`,
  { ...output, version: VERSION },
];

const addActionToPath: TestBuilder = ([description, path, output]) => [
  `${description} running action`,
  `${path}/$${ACTION}`,
  { ...output, action: ACTION },
];

const addApiToPath: TestBuilder = ([description, path, output]) => [
  `${description} ending in /api`,
  `${path}/api`,
  output,
];

const addApiWithFormatToPath: TestBuilder = ([description, path, output]) => [
  `${description} ending in /api/json`,
  `${path}/api/json`,
  output,
];

const addRunToPath: TestBuilder = ([description, path, output]) => [
  `run URL ${description}`,
  `run/${path}`,
  output,
];

const addRelayToPath: TestBuilder = ([description, path, output]) => [
  `relay URL ${description}`,
  `${path}/relay`,
  output,
];

const addRawToPath: TestBuilder = ([description, path, output]) => [
  `relay URL ${description}`,
  `${path}/raw`,
  output,
];

const addEmbedToPath: TestBuilder = ([description, path, output]) => [
  `embeddable URL for ${description}`,
  `embed/${path}`,
  output,
];

const addRunAndEmbedToPath: TestBuilder = ([description, path, output]) => [
  `embeddable run URL for ${description}`,
  `embed/run/${path}`,
  output,
];

/**
 * The most basic test cases build out the rest
 */
const BOOT_PATH: TestCase = ['boot', 'boot', { filename: '__BOOT__' }];
const BASE_PATHS: TestCase[] = [
  ['no filename', '', 'main.ts'],
  ['main without extension', 'main', 'main.ts'],
  ['main with ts extension', 'main.ts', 'main.ts'],
  ['filename without extension', 'foo', 'foo.ts'],
  ['filename with ts extension', 'foo.ts', 'foo.ts'],
].map(([description, path, filename]) => [description, path, { filename }]);

const PATHS_TO_TEST: TestCase[] = [
  // BOOT
  BOOT_PATH,
  addVersionToPath(BOOT_PATH),
  // BASE
  ...BASE_PATHS,
  ...BASE_PATHS.map(addVersionToPath),
  // RAW AND RELAY
  ...BASE_PATHS.map(addRawToPath),
  ...BASE_PATHS.map(addRelayToPath),
  ...BASE_PATHS.map(addVersionToPath).map(addRawToPath),
  ...BASE_PATHS.map(addVersionToPath).map(addRelayToPath),
  // API
  ...BASE_PATHS.map(addApiToPath),
  ...BASE_PATHS.map(addApiWithFormatToPath),
  ...BASE_PATHS.map(addApiToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addApiWithFormatToPath).map(addVersionToPath),
  // RUN & EMBED
  ...BASE_PATHS.map(addRunToPath),
  ...BASE_PATHS.map(addEmbedToPath),
  ...BASE_PATHS.map(addRunAndEmbedToPath),
  ...BASE_PATHS.map(addRunToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addEmbedToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addRunAndEmbedToPath).map(addVersionToPath),
  // ACTIONS
  ...BASE_PATHS.map(addActionToPath),
  ...BASE_PATHS.map(addActionToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addActionToPath).map(addRawToPath),
  ...BASE_PATHS.map(addActionToPath).map(addRelayToPath),
  ...BASE_PATHS.map(addActionToPath).map(addRawToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addActionToPath).map(addRelayToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addActionToPath).map(addApiToPath),
  ...BASE_PATHS.map(addActionToPath).map(addApiWithFormatToPath),
  ...BASE_PATHS.map(addActionToPath).map(addApiToPath).map(addVersionToPath),
  ...BASE_PATHS.map(addActionToPath)
    .map(addApiWithFormatToPath)
    .map(addVersionToPath),
];

describe('Gets the correct filename, action, and version from a URL in the following cases:', () => {
  PATHS_TO_TEST.forEach(([description, path, expected]) => {
    test(`${description} (${path})`, () => {
      expect(parseAppletPath(path)).toEqual(expected);
    });
  });
});
