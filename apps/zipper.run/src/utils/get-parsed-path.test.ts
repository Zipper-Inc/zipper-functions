import { getParsedPath } from './get-parsed-path';

const ACTION = 'actionName';
const VERSION = '1a2b3c';
type TestCase = [
  /** description */
  string,
  /** path */
  string,
  /** results */
  {
    filename: string;
    version?: string | undefined;
    action?: string | undefined;
  },
];
//
const BASE_PATHS: TestCase[] = [
  ['no filename', '/', 'main.ts'],
  ['main without extension', '/main', 'main.ts'],
  ['main with ts extension', '/main.ts', 'main.ts'],
  ['filename without extension', '/foo', 'foo.ts'],
  ['filename with ts extension', '/foo.ts', 'foo.ts'],
].map(([description, path, filename]) => [description, path, { filename }]);

const PATHS_WITH_VERSION: TestCase[] = BASE_PATHS.map(
  ([description, path, results]) => [
    `${description} at version`,
    `/@${VERSION}${path}`,
    { ...results, version: VERSION },
  ],
);

const PATHS_WITH_ACTION: TestCase[] = [
  ...BASE_PATHS,
  ...PATHS_WITH_VERSION,
].map(([description, path, results]) => [
  `${description} running action`,
  `/${path}/${ACTION}`,
  { ...results, description },
]);

const PATHS_WITH_API: TestCase[] = [
  ...BASE_PATHS,
  ...PATHS_WITH_VERSION,
  // ...PATHS_WITH_ACTION,
].map(([description, path, results]) => [
  `${description} ending in /api`,
  `${path}/api`,
  results,
]);

const PATHS_WITH_API_JSON: TestCase[] = [
  ...BASE_PATHS,
  ...PATHS_WITH_VERSION,
  //  ...PATHS_WITH_ACTION,
].map(([description, path, results]) => [
  `${description} ending in /api/json`,
  `${path}/api/json`,
  results,
]);

const PATHS_TO_TEST: TestCase[] = [
  ...BASE_PATHS,
  ...PATHS_WITH_VERSION,
  //  ...PATHS_WITH_ACTION,
];

describe('getParsedPath', () => {
  PATHS_TO_TEST.forEach(([description, path, results]) => {
    test(`${description}`, () => {
      const { filename, version, action } = getParsedPath(path);
      expect(filename).toBe(results.filename);
      expect(version).toBe(results.version);
      // expect(action).toBe(results.action);
    });
  });
});

describe('getParsedPath with /api', () => {
  PATHS_WITH_API.forEach(([description, path, results]) => {
    test(`${description}`, () => {
      const { filename, version, action } = getParsedPath(path, ['api']);
      expect(filename).toBe(results.filename);
      expect(version).toBe(results.version);
      // expect(action).toBe(results.action);
    });
  });
});

describe('getParsedPath with /api/json', () => {
  PATHS_WITH_API_JSON.forEach(([description, path, results]) => {
    test(`${description}`, () => {
      const { filename, version, action } = getParsedPath(path, ['api/json']);
      expect(filename).toBe(results.filename);
      expect(version).toBe(results.version);
      // expect(action).toBe(results.action);
    });
  });
});
