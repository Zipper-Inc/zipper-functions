import { compilerOptions } from './tsconfig.json';

/**
 * Make `tsconfig.json`'s `paths` work in Jest
 * @link https://stackoverflow.com/a/56792936
 */
function makeModuleNameMapperFromTsConfig(srcPath: string) {
  // Get paths from tsconfig
  const { paths }: { paths: Record<string, string[]> } = compilerOptions;

  const aliases: { [key: string]: string } = {};

  // Iterate over paths and convert them into moduleNameMapper format
  Object.keys(paths).forEach((item) => {
    const key = item.replace('/*', '/(.*)');
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const path = paths[item]![0]!.replace('/*', '/$1');
    aliases[key] = srcPath + '/' + path;
  });
  return aliases;
}

const config = {
  verbose: true,
  roots: ['<rootDir>'],
  testMatch: [
    '**/tests/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  testEnvironment: 'node',
  moduleNameMapper: makeModuleNameMapperFromTsConfig('<rootDir>'),
  clearMocks: true,
  preset: 'ts-jest',
};

export default config;