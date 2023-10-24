import { Flex, Link, Stack, StackDivider } from '@chakra-ui/react';
import { OutputType } from '@zipper/types';

import React from 'react';
import stripJs from 'strip-js';
import { defaults as defaultElements } from '../../utils/chakra-markdown-renderer';
import { ActionComponent } from './action-component';
import Array from './array';
import Collection from './collection';
import { Markdown } from './markdown';
import { ObjectExplorer } from './object-explorer';
import { RawFunctionOutput } from './raw-function-output';
import { RouterComponent } from './router-component';
import { useSmartFunctionOutputContext } from './smart-function-output-context';
import { parseResult } from './utils';

export function SmartFunctionOutput({
  result,
  level = 0,
  tableLevel = 0,
  heading,
  parsedResult: parsedResultPassedIn,
}: {
  result: any;
  level: number;
  tableLevel: number;
  heading?: string;
  parsedResult?: ReturnType<typeof parseResult>;
}) {
  const { config } = useSmartFunctionOutputContext();

  // if result === 0, it'll be evaluated as falsey by !result
  if (result === undefined || result === null) return null;

  const { type, data } = parsedResultPassedIn || parseResult(result);

  switch (type) {
    case OutputType.String:
      // Pass through if its not the top level
      if (level > 0) return data.toString();

      return <Markdown children={data.toString()} />;

    case OutputType.Array:
      return (
        <Array
          data={data}
          tableLevel={tableLevel}
          heading={data.length ? heading : undefined}
        />
      );

    case OutputType.Collection:
      return <Collection data={data} level={level} tableLevel={tableLevel} />;

    case OutputType.Html:
      /**
       * 🙈🙊🙉
       * this is a secret config value to allow scripts, just in case
       * snitches get stitches
       */
      const { __dangerouslyAllowScripts } = config as Zipper.HandlerConfig & {
        __dangerouslyAllowScripts: boolean;
      };

      const srcDoc = __dangerouslyAllowScripts ? data : stripJs(data);
      return (
        <Flex height="full" width="full">
          <iframe height="100%" width="100%`" srcDoc={srcDoc} />
        </Flex>
      );

    case OutputType.Object:
      return (
        <ObjectExplorer
          data={data}
          level={level}
          tableLevel={tableLevel}
          heading={heading}
        />
      );

    case OutputType.Action: {
      return <ActionComponent action={data} />;
    }

    case OutputType.SpecialOutputArray: {
      return data.map(
        (d: Zipper.SpecialOutput<`Zipper.${string}`>, index: number) => (
          <SmartFunctionOutput
            key={index}
            result={d}
            level={level}
            tableLevel={tableLevel}
          />
        ),
      );
    }

    case OutputType.Component: {
      const component = data as Zipper.Component;

      switch (component.type) {
        case 'stack': {
          return (
            <Stack
              spacing={component.props?.direction === 'row' ? 2 : 4}
              {...component.props}
              divider={
                component.props?.divider ? (
                  <StackDivider borderColor="fg.200" />
                ) : undefined
              }
            >
              {(component.children as Zipper.Serializable[]).map(
                (child, index) => {
                  return (
                    <SmartFunctionOutput
                      key={index}
                      result={child}
                      level={level + 1}
                      tableLevel={tableLevel}
                    />
                  );
                },
              )}
            </Stack>
          );
        }
        case 'link': {
          component.props.target = component.props.target || '_blank';
          return (
            <Link
              {...component.props}
              textDecoration="underline"
              color="purple"
            >
              {component.text || component.children}
            </Link>
          );
        }
        case 'markdown': {
          const children = window.Array.isArray(data.children)
            ? data.children.join('\n')
            : data.children;

          return <Markdown children={children} />;
        }
        default:
          // Only handle defined 'html' components
          if (!component.type.startsWith('html.')) break;

          // Make HTML components React-friendly
          let element: any = component.type.replace(/^html\./, '');
          const props: Record<string, any> = {
            ['data-generated-by-zipper']: true,
            ...component.props,
          };

          const children = (component.children as Zipper.Serializable[]).map(
            (child, index) => {
              return (
                <SmartFunctionOutput
                  key={index}
                  result={child}
                  level={level + 1}
                  tableLevel={tableLevel}
                />
              );
            },
          );

          // Translate h1-h6 into the format expected by ChakraMarkdownRenderer
          const matchesHeading = element.match(/^h([1-6])$/);
          if (matchesHeading) {
            element = 'heading';
            props.level = parseInt(matchesHeading[1], 10);
          }

          // Grab the default styled element (same as markdown)
          const defaultElement =
            defaultElements[element as keyof typeof defaultElements];

          // Check if the element is a void element
          const voidElements = [
            'area',
            'base',
            'br',
            'col',
            'command',
            'embed',
            'hr',
            'img',
            'input',
            'keygen',
            'link',
            'meta',
            'param',
            'source',
            'track',
            'wbr',
          ];

          if (voidElements.includes(element)) {
            return React.createElement(defaultElement || element, props);
          }

          return React.createElement(
            defaultElement || element,
            props,
            children,
          );
      }
    }

    case OutputType.Router:
      return <RouterComponent route={data} />;

    default:
      return <RawFunctionOutput result={result} />;
  }
}
