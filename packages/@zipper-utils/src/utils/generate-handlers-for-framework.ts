/**
 * 🦕
 * Please refrain from importing anything into this utility to keep it Deno-compatible
 */

export function generateHandlersForFramework({
  code,
  filenames,
}: {
  code: string;
  filenames: string[];
}) {
  // Filter out main since it's hardcoded
  const filenamesFiltered = filenames.filter((f) => f !== 'main.ts');

  const generatedImports = [
    '/// <generated-imports>',
    '/// 🛑 DO NOT MODIFY THIS PART ///',
    ...filenamesFiltered.map((f, i) => `import * as m${i} from '../src/${f}';`),
    '/// </generated-imports>',
  ].join(`\n`);

  const generatedExports = [
    '/// <generated-exports>',
    '/// 🛑 DO NOT MODIFY THIS PART ///',
    ...filenamesFiltered.map((f, i) => `'${f}': m${i}.handler as Handler,`),
    '/// </generated-exports>',
  ].join('\n');

  const importsRegExp = new RegExp(
    '/// <generated-imports[\\d\\D]*?/generated-imports>',
    'g',
  );
  const exportsRegExp = new RegExp(
    '/// <generated-exports[\\d\\D]*?/generated-exports>',
    'g',
  );

  return code
    .replace(importsRegExp, generatedImports)
    .replace(exportsRegExp, generatedExports);
}
