import { parseInputForTypes } from './parse-code';

test('parseInputForTypes should return as optional params that have default values', () => {
  const result = parseInputForTypes({
    code: `export async function handler({
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
    throwErrors: true,
  });
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

test('parseInputForTypes string', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: string }) => param`,
    throwErrors: true,
  });
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
test('parseInputForTypes string literal', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: "hey" }) => param`,
    throwErrors: true,
  });
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

test('parseInputForTypes number', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: number }) => param`,
    throwErrors: true,
  });
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
test('parseInputForTypes literal number', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: 1 }) => param`,
    throwErrors: true,
  });
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

test('parseInputForTypes boolean', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: boolean }) => param`,
    throwErrors: true,
  });
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
test('parseInputForTypes boolean literal true', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: true }) => param`,
    throwErrors: true,
  });
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
test('parseInputForTypes boolean literal false', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ param }: { param: false }) => param`,
    throwErrors: true,
  });
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
test('parseInputForTypes should solve string literals', () => {
  const result = parseInputForTypes({
    code: `export async function handler({ type }: { type: "get-config" | "get-auth-url" }) {
      console.log(type);
      return type;
    }
    `,
    throwErrors: true,
  });
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

test('parseInputForTypes should solve Date', () => {
  const result = parseInputForTypes({
    code: `export async function handler({ type }: { type: Date }) {
      console.log(type);
      return type;
    }
    `,
    throwErrors: true,
  });
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
// test('parseInputForTypes should solve Object { type: { foo: string }} ', () => {
//   const result = parseInputForTypes({
//     code: `export async function handler({ type }: { type: { foo: string } }) {
//       return type;
//     }
//     `,
//     throwErrors: true,
//   });
//   expect(result).toEqual([]);
// });

test('parseInputForTypes should solve array<number> ', () => {
  const result = parseInputForTypes({
    code: `export async function handler({ type }: { type: Array<number> }) {
      return type;
    }
    `,
    throwErrors: true,
  });
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
// test('parseInputForTypes should solve array<{ ok: true; data: string[] } |  { ok: false }> ', () => {
//   const result = parseInputForTypes({
//     code: `export const handler = ({ type }: { type: Array<{ ok: true; data: string[] } | { ok: false }>; }) => type`,
//     throwErrors: true,
//   });
//   expect(result).toEqual([]);
// });

// // ❌ Doesnt work yet -- missing object type parsing
// test('parseInputForTypes should solve { ok: true; data: string[] } |  { ok: false } ', () => {
//   const result = parseInputForTypes({
//     code: `export const handler = ({ type }: { type: { ok: true; data: string[] } | { ok: false } }) => type`,
//     throwErrors: true,
//   });
//   expect(result).toEqual([]);
// });

test('parseInputForTypes should solve Array of literal "view:history" OR "edit:bookmark"', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ type }: { type: ("view:history" | "edit:bookmark")[] }) => type`,
    throwErrors: true,
  });
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

// ✅ New Feature
test('parseInputForTypes should solve Pick', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ type }: { type: Pick<{ a: 'foo', b: 'bar}, 'a'> }) => type`,
    throwErrors: true,
  });
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      node: {
        type: 'object',
        details: {
          properties: [
            {
              key: 'a',
              data: {
                type: 'string',
                details: {
                  literal: 'foo',
                },
              },
            },
          ],
        },
      },
    },
  ]);
});
