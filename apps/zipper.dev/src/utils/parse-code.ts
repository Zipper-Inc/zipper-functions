import { InputParam, InputType } from '@zipper/types';
import { parse } from 'comment-parser';

import {
  ParameterDeclaration,
  Project,
  PropertySignature,
  SyntaxKind,
  ts,
  SourceFile,
  FunctionDeclaration,
  ArrowFunction,
  EnumMember,
  TypeNode,
} from 'ts-morph';

const isExternalImport = (specifier: string) => /^https?:\/\//.test(specifier);
const endsWithTs = (specifier: string) => /\.ts$/.test(specifier);

// Strip the Deno-style file extension since TS-Morph can't handle it
function removeTsExtension(moduleName: string) {
  if (moduleName.slice(-3).toLowerCase() === '.ts')
    return moduleName.slice(0, -3);
  return moduleName;
}

// Determine the Zipper type from the Typescript type
function parseTypeNode(type: any, src: SourceFile): any {
  const text = type.getText();
  if (text.toLowerCase() === 'boolean') return { type: InputType.boolean };
  if (text.toLowerCase() === 'number') return { type: InputType.number };
  if (text.toLowerCase() === 'string') return { type: InputType.string };
  if (text.toLowerCase() === 'date') return { type: InputType.date };
  if (type.isKind(SyntaxKind.ArrayType) || text.startsWith('Array'))
    return { type: InputType.array };
  

  if(type.isKind(SyntaxKind.TypeReference)) {
    // we have a type reference
    const typeReference = type.getTypeName();
    const typeReferenceText = typeReference.getText();

    // find in the code the declaration of the typeReferenceText, this can be a type, a interface, a enum, etc.
    const typeReferenceDeclaration = src.getTypeAlias(typeReferenceText) || src.getInterface(typeReferenceText) || src.getEnum(typeReferenceText);



    //we have the declaration, we need to know if it's a type, interface or enum
    if(typeReferenceDeclaration) {
      if(typeReferenceDeclaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
        // we have a type
        const typeReferenceDeclarationType = typeReferenceDeclaration.getTypeNode();

        // check if type is a string literal
        if(typeReferenceDeclarationType && typeReferenceDeclarationType.isKind(SyntaxKind.UnionType)) {

          const unionTypes = typeReferenceDeclarationType.getTypeNodes();
          const unionTypesDetails = unionTypes.map((unionType: TypeNode) => {
            return unionType.getText().replace(/['"]+/g, '').trim();
          });

          console.log('unionTypeDetails', unionTypesDetails)

          return {
            type: InputType.enum,
            details: {
              values: unionTypesDetails,
            },
          };
        }
        return parseTypeNode(typeReferenceDeclarationType, src);
      }
      if(typeReferenceDeclaration.isKind(SyntaxKind.InterfaceDeclaration)) {
        // we have a interface
        const typeReferenceDeclarationProperties = typeReferenceDeclaration.getProperties();
        const propDetails = typeReferenceDeclarationProperties.map((prop: any) => {
          return {
            key: prop.getName(),
            details: parseTypeNode(prop.getTypeNode(), src),
          };
        }
        );
        return {
          type: InputType.object,
          details: { properties: propDetails },
        };
      }
      if(typeReferenceDeclaration.isKind(SyntaxKind.EnumDeclaration)) {
        // we have a enum
        return {
          type: InputType.enum,
          details: {
            values: typeReferenceDeclaration
              .getMembers()
              .map((member: EnumMember) => {
                const memberText = member.getFullText().trim();

                // check if the memberText has a value by checking if it has a '='
                const hasValue = memberText.includes('=');
                if(!hasValue) {
                  return memberText.trim();
                }

                // if it has a value, we need to extract it
                const memberValue = memberText.split('=')[1]?.replace(/['"]+/g, '').trim();
                return {
                  key: memberText.split('=')[0]?.trim(),
                  value: memberValue,
                };
              }),
          },
        }
      }
    }
  }

  // Handle keyof typeof Category type
  if (type.isKind(SyntaxKind.TypeOperator)) {
    const typeText = type.getText();
    const match = typeText.match(/keyof typeof (\w+)/);
    if (match && match[1]) {
      const enumName = match[1];
      const enumDeclaration = src.getEnum(enumName);
      if (enumDeclaration) {
        return {
          type: InputType.enum,
          details: {
            values: enumDeclaration
              .getMembers()
              .map((member: any) => member.getName()),
          },
        };
      }
    }
  }
  return { type: InputType.any };
}

function getSourceFileFromCode(code: string) {
  const project = new Project({
    useInMemoryFileSystem: true,
    resolutionHost: (moduleResolutionHost, getCompilerOptions) => {
      return {
        resolveModuleNames: (moduleNames, containingFile) => {
          const compilerOptions = getCompilerOptions();
          const resolvedModules: ts.ResolvedModule[] = [];

          for (const moduleName of moduleNames.map(removeTsExtension)) {
            const result = ts.resolveModuleName(
              moduleName,
              containingFile,
              compilerOptions,
              moduleResolutionHost,
            );
            if (result.resolvedModule)
              resolvedModules.push(result.resolvedModule);
          }

          return resolvedModules;
        },
      };
    },
  });

  return project.createSourceFile('main.ts', code);
}

// returns undefined if the file isn't runnable (no handler function)
export function parseInputForTypes({
  code = '',
  throwErrors = false,
  srcPassedIn,
}: { code?: string; throwErrors?: boolean; srcPassedIn?: SourceFile } = {}):
  | undefined
  | InputParam[] {
  if (!code) return undefined;

  try {
    const src = srcPassedIn || getSourceFileFromCode(code);

    // Determine if there's a function handler
    let handlerFn: FunctionDeclaration | ArrowFunction | undefined =
      src.getFunction('handler');

    // If not, determine if there's a variable that's a handler arrow function
    const handlerNode = handlerFn || src.getVariableDeclaration('handler');
    handlerFn =
      handlerFn || handlerNode?.getFirstChildByKind(SyntaxKind.ArrowFunction);

    // All good, this is a lib file!
    if (!handlerNode || !handlerFn) {
      return undefined;
    }

    // Now make sure it gets exported and is not the default
    if (!handlerNode.hasExportKeyword() && throwErrors) {
      throw new Error('The handler function must be exported.');
    }
    if (handlerNode.hasDefaultKeyword() && throwErrors) {
      throw new Error('The handler function cannot be the default export.');
    }

    const inputs = handlerFn.getParameters();
    const params = inputs[0] as ParameterDeclaration;

    if (!params) {
      return [];
    }

    const typeNode = params.getTypeNode();

    if (typeNode?.isKind(SyntaxKind.AnyKeyword)) {
      return [
        {
          key: params.getName(),
          type: InputType.any,
          optional: params.hasQuestionToken(),
        },
      ];
    }

    let props: PropertySignature[] = [];

    try {
      props = typeNode?.isKind(SyntaxKind.TypeLiteral)
        ? // A type literal, like `params: { foo: string, bar: string }`
          (typeNode as any)?.getProperties()
        : // A type reference, like `params: Params`
          // Finds the type alias by its name and grabs the node from there
          (
            src
              .getTypeAlias(typeNode?.getText() as string)
              ?.getTypeNode() as any
          )?.getProperties();
    } catch (e) {
      if (throwErrors) {
        throw new Error('Cannot get the properties of the object parameter.');
      }
      return [];
    }

    console.log('props', props);


    if (!typeNode || !props) {
      console.error('No types, treating input as any');
    }

    return props.map((prop) => {
      const typeNode = prop.getTypeNode();
      const typeDetails = parseTypeNode(typeNode, src);

      return {
        key: prop.getName(),
        type: typeDetails.type,
        details: typeDetails.details,
        optional: prop.hasQuestionToken(),
      };
    });
  } catch (e) {
    if (throwErrors) throw e;
    console.error('caught during parseInputForTypes', e);
  }
  return [];
}

export function parseExternalImportUrls({
  code = '',
  srcPassedIn,
  externalOnly = true,
}: {
  code?: string;
  srcPassedIn?: SourceFile;
  externalOnly?: boolean;
} = {}): string[] {
  if (!code) return [];
  const src = srcPassedIn || getSourceFileFromCode(code);
  return src
    .getImportDeclarations()
    .map((i) => i.getModuleSpecifierValue())
    .filter((s) => (externalOnly ? isExternalImport(s) : true));
}

export function parseLocalImports({
  code = '',
  srcPassedIn,
  externalOnly = true,
}: {
  code?: string;
  srcPassedIn?: SourceFile;
  externalOnly?: boolean;
} = {}) {
  if (!code) return [];
  const src = srcPassedIn || getSourceFileFromCode(code);
  return src
    .getImportDeclarations()
    .filter((i) => !isExternalImport(i.getModuleSpecifierValue()))
    .map((i) => {
      const startPos = i.getStart();
      const endPos = i.getEnd();
      const { column: startColumn, line: startLine } =
        src.getLineAndColumnAtPos(startPos);
      const { column: endColumn, line: endLine } =
        src.getLineAndColumnAtPos(endPos);
      return {
        specifier: i.getModuleSpecifierValue(),
        startLine,
        startColumn,
        startPos,
        endLine,
        endColumn,
        endPos,
      };
    });
}

export function parseCode({
  code = '',
  throwErrors = false,
  srcPassedIn,
}: { code?: string; throwErrors?: boolean; srcPassedIn?: SourceFile } = {}) {
  const src = srcPassedIn || (code ? getSourceFileFromCode(code) : undefined);
  let inputs = parseInputForTypes({ code, throwErrors, srcPassedIn: src });
  const externalImportUrls = parseExternalImportUrls({
    code,
    srcPassedIn: src,
  });

  const localImports = parseLocalImports({ code, srcPassedIn: src });

  const comments = parseComments({ code, srcPassedIn: src });
  if (comments) {
    inputs = inputs?.map((i) => {
      const matchingTag = comments.tags.find(
        (t) => t.tag === 'param' && t.name === i.key,
      );
      if (!matchingTag) return i;
      const [name, description] = matchingTag.description
        .split(':')
        .map((i) => i.trim());
      return { ...i, name, description };
    });
  }
  return { inputs, externalImportUrls, comments, localImports };
}

export function addParamToCode({
  code,
  paramName = 'newInput',
  paramType = 'string',
}: {
  code: string;
  paramName?: string;
  paramType?: string;
}): string {
  const src = getSourceFileFromCode(code);
  const handler = src.getFunction('handler');

  if (!handler) {
    console.error('You must define a handler function');
    return code;
  }

  const inputs = handler.getParameters();
  if (!inputs.length) {
    // Create a new input object with the desired parameter
    const newParamString = `{ ${paramName} } : { ${paramName}
      ${paramType ? `: ${paramType}` : ''}
    }`;

    handler.replaceWithText(
      handler.getText().replace(/\(\)/, `(${newParamString})`),
    );

    return src.getFullText();
  }

  if (inputs.length !== 1 && inputs.length > 0) {
    return code;
  }

  const params = inputs[0] as ParameterDeclaration;
  const typeNode = params.getTypeNode();

  if (!typeNode) {
    console.error('No types, treating input as any');
    return code;
  }

  const existingParams = parseInputForTypes({ code });
  if (!existingParams) return code;
  // If there is an existing parameter, use its name instead of the default paramName
  if (existingParams.length && existingParams[0]) {
    paramName = existingParams[0].key;
  }

  if (existingParams.some((param) => param.key === paramName)) {
    console.error('Parameter with the same name already exists');
    return code;
  }

  const insertPosition = typeNode.getEnd() - 1;

  // Check if there's a type literal
  if (typeNode.isKind(SyntaxKind.TypeLiteral)) {
    const newParamString = existingParams.length
      ? `, ${paramName}${paramType ? `: ${paramType}` : ''}`
      : `${paramName}${paramType ? `: ${paramType}` : ''}`;

    const newCode = [
      code.slice(0, insertPosition),
      newParamString,
      code.slice(insertPosition),
    ].join('');

    return newCode;
  }

  // If there's no type literal, create one
  const newParamString = `{ ${paramName}${paramType ? `: ${paramType}` : ''} }`;
  const newCode = code.replace(
    /(\{[\s\S]*\})\s*:/,
    (_, match) => `${match} : ${newParamString}`,
  );

  return newCode;
}

export function parseComments({
  code,
  srcPassedIn,
}: {
  code?: string;
  srcPassedIn?: SourceFile;
}) {
  if (!code) return;

  const src = srcPassedIn || getSourceFileFromCode(code);
  const handlerFn = src.getFunction('handler');

  if (!handlerFn) return;

  const jsDocComments = handlerFn.getJsDocs();
  if (jsDocComments.length > 0) {
    return parse(jsDocComments.at(-1)?.getFullText() || '')[0];
  }

  return;
}
