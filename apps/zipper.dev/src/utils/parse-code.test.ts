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
      type: 'string',
    },
    {
      key: 'test',
      optional: true,
      type: 'number',
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
      type: 'string',
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
      type: 'string',
      details: { literal: 'hey' },
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
      type: 'number',
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
      type: 'number',
      details: { literal: '1' },
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
      type: 'boolean',
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
      type: 'boolean',
      details: { literal: 'true' },
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
      type: 'boolean',
      details: { literal: 'false' },
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
      type: 'union',
      details: {
        values: [
          { type: 'string', details: { literal: 'get-config' } },
          { type: 'string', details: { literal: 'get-auth-url' } },
        ],
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
      type: 'date',
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes should solve Object { foo: string } ', () => {
  const result = parseInputForTypes({
    code: `export async function handler({ type }: { type: { foo: string } }) {
      return type;
    }
    `,
    throwErrors: true,
  });
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      type: 'object',
      details: { properties: [{ key: 'foo', details: { type: 'string' } }] },
    },
  ]);
});

// ✅ New Feature
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
      type: 'array',
      details: {
        isUnion: false,
        values: { type: 'number' },
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes should solve array<{ ok: true; data: string[] } |  { ok: false }> ', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ type }: { type: Array<{ ok: true; data: string[] } | { ok: false }>; }) => type`,
    throwErrors: true,
  });
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      type: 'array',
      details: {
        isUnion: true,
        values: [
          {
            type: 'object',
            details: {
              properties: {
                ok: { type: 'boolean', details: { literal: 'true' } },
                data: {
                  type: 'array',
                  details: {
                    isUnion: false,
                    values: { type: 'string' },
                  },
                },
              },
            },
          },
          {
            type: 'object',
            details: {
              properties: {
                ok: { type: 'boolean', details: { literal: 'false' } },
              },
            },
          },
        ],
      },
    },
  ]);
});

// ✅ New Feature
test('parseInputForTypes should solve Array of literal "view:history" OR "edit:bookmark"', () => {
  const result = parseInputForTypes({
    code: `export const handler = ({ type }: { type: ("view:history" | "edit:bookmark")[] }) => type`,
    throwErrors: true,
  });
  expect(result).toEqual([
    {
      key: 'type',
      optional: false,
      type: 'array',
      details: {
        isUnion: true,
        values: [
          { type: 'string', details: { literal: 'view:history' } },
          { type: 'string', details: { literal: 'edit:bookmark' } },
        ],
      },
    },
  ]);
});
