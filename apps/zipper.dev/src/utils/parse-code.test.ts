import { createProject, parseApp, parseInputForTypes } from './parse-code';

const parseInputTypeUsingCode = (code: string) => {
  const project = createProject();
  project.createSourceFile('main.ts', code);
  return parseInputForTypes({
    handlerFile: 'main.ts',
    project,
  });
};

test('parseInputForTypes should return as optional params that have default values', async () => {
  const result = await parseInputTypeUsingCode(
    `export async function handler({
      test = 3,
      worldString = "Hello",
    }: {
      worldString: string;
      test: number;
    }) {
      console.log(test);
      return worldString;
    }
    `,
  );
  expect(result).toEqual([
    {
      key: 'worldString',
      optional: true,
      node: {
        type: 'string',
      },
    },
    {
      key: 'test',
      optional: true,
      node: {
        type: 'number',
      },
    },
  ]);
});

test('parseInputForTypes string', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: string }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'string',
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes string literal', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: "hey" }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'string',
        details: { literal: 'hey' },
      },
    },
  ]);
});

test('parseInputForTypes number', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: number }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'number',
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes literal number', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: 1 }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'number',
        details: { literal: 1 },
      },
    },
  ]);
});

test('parseInputForTypes boolean', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: boolean }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'boolean',
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes boolean literal true', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: true }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'boolean',
        details: { literal: true },
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes boolean literal false', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ param }: { param: false }) => param`,
  );
  expect(result).toEqual([
    {
      key: 'param',
      optional: false,
      node: {
        type: 'boolean',
        details: { literal: false },
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes should solve string literals', async () => {
  const result = await parseInputTypeUsingCode(
    `export async function handler({ type }: { type: "get-config" | "get-auth-url" }) {
      console.log(type);
      return type;
    }
    `,
  );
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      node: {
        type: 'union',
        details: {
          values: [
            { type: 'string', details: { literal: 'get-config' } },
            { type: 'string', details: { literal: 'get-auth-url' } },
          ],
        },
      },
    },
  ]);
});

test('parseInputForTypes should solve Date', async () => {
  const result = await parseInputTypeUsingCode(
    `export async function handler({ type }: { type: Date }) {
      console.log(type);
      return type;
    }
    `,
  );
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      node: {
        type: 'date',
      },
    },
  ]);
});

// // ❌ Doesnt work yet -- missing object type parsing
// test('parseInputForTypes should solve Object { type: { foo: string }} ', async () => {
//   const result = await parseInputTypeUsingCode(
//     `export async function handler({ type }: { type: { foo: string } }) {
//       return type;
//     }
//     `,
//     throwErrors: true,
//   });
//   expect(result).toEqual([]);
// });

test('parseInputForTypes should solve array<number> ', async () => {
  const result = await parseInputTypeUsingCode(
    `export async function handler({ type }: { type: Array<number> }) {
      return type;
    }
    `,
  );
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      node: {
        type: 'array',
        details: {
          isUnion: false,
          values: { type: 'number' },
        },
      },
    },
  ]);
});

// // ❌ Doesnt work yet -- missing object type parsing
// test('parseInputForTypes should solve array<{ ok: true; data: string[] } |  { ok: false }> ', async () => {
//   const result = await parseInputTypeUsingCode(
//     `export const handler = ({ type }: { type: Array<{ ok: true; data: string[] } | { ok: false }>; }) => type`,
//     throwErrors: true,
//   });
//   expect(result).toEqual([]);
// });

// // ❌ Doesnt work yet -- missing object type parsing
// test('parseInputForTypes should solve { ok: true; data: string[] } |  { ok: false } ', async () => {
//   const result = await parseInputTypeUsingCode(
//     `export const handler = ({ type }: { type: { ok: true; data: string[] } | { ok: false } }) => type`,
//     throwErrors: true,
//   });
//   expect(result).toEqual([]);
// });

test('parseInputForTypes should solve Array of literal "view:history" OR "edit:bookmark"', async () => {
  const result = await parseInputTypeUsingCode(
    `export const handler = ({ type }: { type: ("view:history" | "edit:bookmark")[] }) => type`,
  );
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      node: {
        type: 'array',
        details: {
          isUnion: true,
          values: [
            { type: 'string', details: { literal: 'view:history' } },
            { type: 'string', details: { literal: 'edit:bookmark' } },
          ],
        },
      },
    },
  ]);
});

// // ❌ Doesnt work yet -- missing object type parsing
// test('parseInputForTypes should solve Pick', async () => {
//   const result = await parseInputTypeUsingCode(
//     `export const handler = ({ type }: { type: Pick<{ a: 'foo', b: 'bar}, 'a'> }) => type`,
//     throwErrors: true,
//   });
//   expect(result).toEqual([
//     {
//       key: 'type',
//       optional: false,
//       node: {
//         type: 'object',
//         details: {
//           properties: [
//             {
//               key: 'a',
//               data: {
//                 type: 'string',
//                 details: {
//                   literal: 'foo',
//                 },
//               },
//             },
//           ],
//         },
//       },
//     },
//   ]);
// });

test('Solve simple type imports', async () => {
  const project = createProject();
  project.createSourceFile(
    'main.ts',
    `
    import { LocalSimpleInput } from './types.ts';
    export const handler = (input: LocalSimpleInput) => input;
  `,
  );
  project.createSourceFile(
    'types.ts',
    `export type LocalSimpleInput = { foo: string }`,
  );

  const result = await parseApp({
    handlerFile: 'main.ts',
    project,
  });
  expect(result.inputs).toEqual([
    {
      key: 'foo',
      optional: false,
      node: {
        type: 'string',
      },
    },
  ]);
});
test('Solve complex type imports even with uneeded imports', async () => {
  const project = createProject();
  project.createSourceFile(
    'main.ts',
    `
    import { LocalComplexInput } from './types.ts';
    import { SlackUserAuth } from "https://zipper.dev/zipper-inc/slack-install-link/src/main.ts"
    export const handler = (input: LocalComplexInput) => input;
  `,
  );
  project.createSourceFile(
    'types.ts',
    `
    import { Complex } from './type-complex.ts';
    export type LocalComplexInput = { complex: Complex };
  `,
  );
  project.createSourceFile(
    'type-complex.ts',
    `export type Complex = 'yeah' | 'complex';`,
  );

  const result = await parseApp({
    handlerFile: 'main.ts',
    project,
  });
  expect(result.inputs).toEqual([
    {
      key: 'complex',
      optional: false,
      node: {
        type: 'union',
        details: {
          values: [
            {
              type: 'string',
              details: {
                literal: 'yeah',
              },
            },
            {
              type: 'string',
              details: {
                literal: 'complex',
              },
            },
          ],
        },
      },
    },
  ]);
});
