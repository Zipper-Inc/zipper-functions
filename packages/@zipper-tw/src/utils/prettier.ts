import typescript from 'prettier/parser-typescript';
import prettier from 'prettier/standalone';

export function prettierFormat(source: string) {
  return prettier.format(source, {
    parser: 'typescript',
    plugins: [typescript],
  });
}
