import { InputParam, InputType } from '@zipper/types';

import {
  ParameterDeclaration,
  Project,
  PropertySignature,
  SyntaxKind,
  ts,
  SourceFile,
} from 'ts-morph';

// Strip the Deno-style file extension since TS-Morph can't handle it
function removeTsExtension(moduleName: string) {
  if (moduleName.slice(-3).toLowerCase() === '.ts')
    return moduleName.slice(0, -3);
  return moduleName;
}

// Determine the Zipper type from the Typescript type
function parseTypeNode(type: any) {
  const text = type.getText();
  if (text.toLowerCase() === 'boolean') return InputType.boolean;
  if (text.toLowerCase() === 'number') return InputType.number;
  if (text.toLowerCase() === 'string') return InputType.string;
  if (text.toLowerCase() === 'date') return InputType.date;
  if (type.isKind(SyntaxKind.ArrayType) || text.startsWith('Array'))
    return InputType.array;
  if (type.isKind(SyntaxKind.TypeLiteral) || text.startsWith('Record'))
    return InputType.object;
  return InputType.any;
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

export function parseInputForTypes(
  code = '',
  throwErrors = false,
  srcPassedIn?: SourceFile,
): undefined | InputParam[] {
  if (!code && !throwErrors) return [];
  if (!code && throwErrors) throw new Error('No main function');

  try {
    const src = srcPassedIn || getSourceFileFromCode(code);

    const handlerFn = src.getFunction('handler');

    if (!handlerFn || !handlerFn.hasExportKeyword()) {
      if (throwErrors) throw new Error('You must export a handler function');
      console.error('You must export a handler function');
      return [];
    }

    if (handlerFn.hasDefaultKeyword() && throwErrors)
      throw new Error('The handler function cannot be the default export');

    const inputs = handlerFn.getParameters();
    if (inputs.length !== 1 && inputs.length > 0) {
      if (throwErrors)
        throw new Error('You must have one and only one input object');
      console.error('You must have one and only one input object');
    }
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
        throw new Error('Cannot get properties for your input');
      }
      return [];
    }

    if (!typeNode || !props) {
      console.error('No types, treating input as any');
    }

    return props.map((prop) => {
      const typeNode = prop.getTypeNode();
      return {
        key: prop.getName(),
        type: parseTypeNode(typeNode),
        optional: prop.hasQuestionToken(),
      };
    });
  } catch (e) {
    if (throwErrors) throw e;
    console.error('caught during parseInputForTypes', e);
  }
  return [];
}

export function parseImports(code = '', srcPassedIn?: SourceFile): string[] {
  if (!code) return [];
  const src = srcPassedIn || getSourceFileFromCode(code);
  return src.getImportDeclarations().map((i) => i.getModuleSpecifierValue());
}

export function parseCode(
  code = '',
  throwErrors = false,
  srcPassedIn?: SourceFile,
) {
  const src = code ? getSourceFileFromCode(code) : undefined;
  const inputs = parseInputForTypes(code, throwErrors, src);
  const imports = parseImports(code, src);
  return { inputs, imports };
}

export function addParamToCode(
  code: string,
  paramName = 'newInput',
  paramType = 'string',
): string {
  const src = getSourceFileFromCode(code);
  const handler = src.getFunction('handler');

  if (!handler) {
    console.error('You must define a handler function');
    return code;
  }

  const inputs = handler.getParameters();
  if (!inputs.length) {
    // Create a new input object with the desired parameter
    const newParamString = `{ ${paramName} } : { ${paramName}${
      paramType ? `: ${paramType}` : ''
    } }`;

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

  const existingParams = parseInputForTypes(code);
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
