import prettier from 'prettier/standalone';
import babelParser from 'prettier/parser-babel';

export function format(source: string) {
  return prettier.format(source, {
    parser: 'babel',
    plugins: [babelParser],
  });
}
