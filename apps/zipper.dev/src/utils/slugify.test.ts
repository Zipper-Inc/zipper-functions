import { slugifyAllowDot } from './slugify';
describe('slugifyAllowDot', () => {
  it('should slugify a string with default options and allow dot', () => {
    const input = 'Hello.World!';
    const expectedOutput = 'hello.world';
    const result = slugifyAllowDot(input);
    expect(result).toEqual(expectedOutput);
  });

  it('should slugify a string with custom options and allow dot', () => {
    const input = 'Hello.World!';
    const options = { lower: false };
    const expectedOutput = 'Hello.World';
    const result = slugifyAllowDot(input, options);
    expect(result).toEqual(expectedOutput);
  });
});
