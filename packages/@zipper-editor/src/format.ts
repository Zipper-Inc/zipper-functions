import * as prettier from 'prettier'
import * as prettierTsPlugin from 'prettier/plugins/typescript'

export const formatCode = async (code: string) => {
  return prettier.format(code, {
    parser: 'typescript',
    plugins: [prettierTsPlugin],
  })
}