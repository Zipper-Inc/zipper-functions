import type { Script } from '@prisma/client';
import * as monaco from 'monaco-editor';
import type { MutableRefObject } from 'react';
import { getPathFromUri, getUriFromPath } from '~/utils/model-uri';
import { isExternalImport } from '~/utils/parse-code';
import {
  isZipperImportUrl,
  X_ZIPPER_ESZIP_BUILD_HEADER,
} from '~/utils/eszip-utils';
import Fuse from 'fuse.js';
import { rewriteSpecifier } from '~/utils/rewrite-imports';

/** This string indicates which errors we own in the editor */
export const ZIPPER_LINTER = 'zipper-linter';

/** Some error codes for Zipper Linting */
export enum ZipperLintCode {
  CannotFindModule = 'Z001',
}

export async function runZipperLinter({
  editor,
  imports,
  monacoRef,
  currentScript,
}: {
  editor: typeof monaco.editor;
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
}) {
  if (!monacoRef.current) return;

  const markers: monaco.editor.IMarkerData[] = [];

  const currentUri = getUriFromPath(
    currentScript.filename,
    monacoRef.current.Uri.parse,
    'tsx',
  );
  const currentModel = editor.getModel(currentUri);

  // Not sure how this would happen but if there's no model, there's nothing to do
  if (!currentModel) return;

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

      if (isExternalImport(rewrittenSpecifier)) {
        const { status, headers } = await fetch(rewrittenSpecifier, {
          redirect: 'follow',
          headers: isZipperImportUrl(rewrittenSpecifier)
            ? { [X_ZIPPER_ESZIP_BUILD_HEADER]: 'true' }
            : undefined,
        }).catch();

        const fromZipper = isZipperImportUrl(rewrittenSpecifier);
        if (status === 200 && !fromZipper) return;
        if (
          status === 200 &&
          fromZipper &&
          headers.get('content-type')?.toLowerCase().includes('typescript')
        ) {
          return;
        }
      }

      // If it's not a module, let's add an error
      let message = `Cannot find module \`${i.specifier}\' in applet.`;
      let suggestion;

      if (isZipperImportUrl(rewrittenSpecifier)) {
        message = `Cannot find module \`${rewrittenSpecifier}\` on Zipper.`;
      } else if (isExternalImport(rewrittenSpecifier)) {
        const npmName = i.specifier.replace(/^npm:/, '');
        const results = await fetch(
          `https://registry.npmjs.com/-/v1/search?text=${npmName}&size=20`,
        )
          .then((r) => r.json())
          .catch();

        message = `Cannot find module \`${npmName}\` on npm.`;
        suggestion = results?.objects?.length
          ? results.objects[0].package.name
          : '';
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
        message = `${message}\n\nDid you mean \`${suggestion}\`?`;
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

  editor.removeAllMarkers(ZIPPER_LINTER);
  editor.setModelMarkers(currentModel, ZIPPER_LINTER, markers);
}
