import prettier from 'prettier/standalone';
import typescript from 'prettier/parser-typescript';

export function format(source: string) {
  return prettier.format(source, {
    parser: 'typescript',
    plugins: [typescript],
  });
}
