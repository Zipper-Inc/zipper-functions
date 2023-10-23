import type { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import type { MutableRefObject } from 'react';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { isExternalImport } from '~/utils/parse-code';
import { isZipperImportUrl, X_ZIPPER_ESZIP_BUILD } from '~/utils/eszip-utils';
import Fuse from 'fuse.js';
import { rewriteSpecifier } from '~/utils/rewrite-imports';

/** This string indicates which errors we own in the editor */
export const ZIPPER_LINTER = 'zipper-linter';

/** Some error codes for Zipper Linting */
export enum ZipperLintCode {
  CannotFindModule = 'Z001',
}

// A little bit of a hack. Better if this is passed in or something.
let zipperLinterLastRunTs = 0;

export async function runZipperLinter({
  imports,
  monacoRef,
  currentScript,
  externalImportModelsRef,
  invalidImportUrlsRef,
}: {
  imports: {
    specifier: string;
    startLine: number;
    startColumn: number;
    startPos: number;
    endLine: number;
    endColumn: number;
    endPos: number;
  }[];
  monacoRef: MutableRefObject<typeof monaco | undefined>;
  currentScript: Script;
  externalImportModelsRef?: MutableRefObject<Record<string, string[]>>;
  invalidImportUrlsRef?: MutableRefObject<{ [url: string]: number }>;
}) {
  if (!monacoRef.current) return;
  const { editor } = monacoRef.current;

  const markers: monaco.editor.IMarkerData[] = [];

  const currentUri = getUriFromPath(
    currentScript.filename,
    monacoRef.current.Uri.parse,
    'tsx',
  );
  const currentModel = editor.getModel(currentUri);

  // Not sure how this would happen but if there's no model, there's nothing to do
  if (!currentModel) return;

  const lintRunTs = Date.now();
  zipperLinterLastRunTs = lintRunTs;

  const externalImportsForThisFile =
    externalImportModelsRef?.current?.[currentScript.filename] || [];

  // Handle imports and check to make sure they are valid
  // Reports Z0001: Cannot find module
  await Promise.all(
    imports.map(async (i) => {
      if (!monacoRef.current) return;
      const potentialModelUri = getUriFromPath(
        // Remove the first two characters, which should be `./`
        // The relative path is required by Deno/Zipper
        i.specifier.substring(2),
        monacoRef.current.Uri.parse,
        'tsx',
      );

      // If we can find a model, we're good
      if (editor.getModel(potentialModelUri)) return;

      // See if this resolves to a valid external import via our rewrites
      const rewrittenSpecifier = rewriteSpecifier(i.specifier);

      if (externalImportsForThisFile.includes(rewrittenSpecifier)) return;

      if (isExternalImport(rewrittenSpecifier)) {
        try {
          // throw if we now it's invalid, and let it lint
          if (invalidImportUrlsRef?.current?.[rewrittenSpecifier])
            throw new Error('Previously invalidated import');

          const { status, headers } = await fetch(rewrittenSpecifier, {
            redirect: 'follow',
            headers: isZipperImportUrl(rewrittenSpecifier)
              ? { [X_ZIPPER_ESZIP_BUILD]: 'true' }
              : undefined,
          });

          // todo - actually validate if its real typescript

          const fromZipper = isZipperImportUrl(rewrittenSpecifier);
          if (status === 200 && !fromZipper) return;
          if (
            status === 200 &&
            fromZipper &&
            headers.get('content-type')?.toLowerCase().includes('typescript')
          ) {
            return;
          }
        } catch (e) {
          // error cases will be handled below anyways
        }
      }

      // If it's not a module, let's add an error
      let message = `Cannot find module "${i.specifier}" in applet.`;
      let suggestion;

      if (isZipperImportUrl(rewrittenSpecifier)) {
        message = `Cannot find module ${rewrittenSpecifier} on Zipper.`;
      } else if (isExternalImport(i.specifier)) {
        message = `Cannot find module at ${i.specifier}`;
        try {
          new URL(i.specifier);
        } catch (e) {
          suggestion = `${i.specifier} is not a valid URL.`;
        }
      } else if (isExternalImport(rewrittenSpecifier)) {
        const npmName = i.specifier.replace(/^npm:/, '');
        const results = await fetch(
          `https://registry.npmjs.com/-/v1/search?text=${npmName}&size=20`,
        )
          .then((r) => r.json())
          .catch();

        message = `Cannot find module "${npmName}" on npm.`;
        const resultName =
          results?.objects?.length && results.objects[0].package.name;
        if (resultName && resultName !== npmName) suggestion = resultName;
      } else {
        const localModelUris = editor
          .getModels()
          .map((m) => m.uri)
          .filter((u) => u.scheme === 'file' && u.path !== currentUri.path);

        // Search through paths to see if there's somethign similar to the broken path
        const fuse = new Fuse(localModelUris.map((u) => u.path));
        const [topSuggestion] = fuse.search(i.specifier);
        // If there is, lets grab the full URI based on the original index
        const suggestedUri =
          topSuggestion && localModelUris[topSuggestion.refIndex];
        suggestion = suggestedUri ? `.${getPathFromUri(suggestedUri)}` : '';
      }

      if (suggestion) {
        message = `${message}\n\nDid you mean "${suggestion}"?`;
      }

      markers.push({
        startLineNumber: i.startLine,
        startColumn: i.startColumn,
        endLineNumber: i.endLine,
        endColumn: i.endColumn,
        severity: monacoRef.current.MarkerSeverity.Error,
        message,
        code: ZipperLintCode.CannotFindModule,
      });
    }),
  );

  // Since we've waited a little for all these fetches
  // Make sure this is the most recent lint run
  // If not, return early
  if (zipperLinterLastRunTs !== lintRunTs) return;

  editor.removeAllMarkers(ZIPPER_LINTER);
  editor.setModelMarkers(currentModel, ZIPPER_LINTER, markers);
}
