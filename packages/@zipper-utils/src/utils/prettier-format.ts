import typescript from 'prettier/plugins/typescript'
import prettier from 'prettier/standalone';
import prettierPluginEstree from "prettier/plugins/estree"

export function prettierFormat(source: string) {
  return prettier.format(source, {
    parser: 'typescript',
    plugins: [typescript, prettierPluginEstree],
  });
}
