import { parseInputForTypes } from './parse-code';

test('parseInputForTypes should return as optional params that have default valeus', () => {
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
