import { Box, Stack, StackDivider, Link } from '@chakra-ui/react';
import { OutputType } from '@zipper/types';
import ReactMarkdown from 'react-markdown';

import { ObjectExplorer } from './object-explorer';
import { parseResult } from './utils';
import { RawFunctionOutput } from './raw-function-output';
import { ActionComponent } from './action-component';
import { RouterComponent } from './router-component';
import Collection from './collection';
import Array from './array';
import ChakraUIRenderer, {
  defaults as defaultElements,
} from '../../utils/chakra-markdown-renderer';
import React from 'react';

export function SmartFunctionOutput({
  result,
  level = 0,
  tableLevel = 0,
}: {
  result: any;
  level: number;
  tableLevel: number;
}) {
  if (!result) return null;

  const { type, data } = parseResult(result);

  switch (type) {
    case OutputType.String:
      // Pass through if its not the top level
      if (level > 0) return data.toString();

      return (
        <ReactMarkdown
          components={ChakraUIRenderer()}
          children={data.toString()}
        />
      );

    case OutputType.Array:
      return <Array data={data} tableLevel={tableLevel} />;

    case OutputType.Collection:
      return <Collection data={data} level={level} tableLevel={tableLevel} />;

    case OutputType.Html:
      return (
        <Box>
          <iframe width="100%" height="400px" srcDoc={data} />
        </Box>
      );

    case OutputType.Object:
      return (
        <ObjectExplorer data={data} level={level} tableLevel={tableLevel} />
      );

    case OutputType.Action: {
      return <ActionComponent action={data} />;
    }

    case OutputType.SpecialOutputArray: {
      return data.map((d: Zipper.SpecialOutput<`Zipper.${string}`>) => (
        <SmartFunctionOutput result={d} level={level} tableLevel={tableLevel} />
      ));
    }

    case OutputType.Component: {
      const component = data as Zipper.Component;

      switch (component.type) {
        case 'stack': {
          return (
            <Stack
              {...component.props}
              divider={
                component.props?.divider ? (
                  <StackDivider borderColor="gray.200" />
                ) : undefined
              }
              spacing={component.props?.direction === 'row' ? 6 : 4}
            >
              {(component.children as Zipper.Serializable[]).map((child) => {
                return (
                  <SmartFunctionOutput
                    result={child}
                    level={level + 1}
                    tableLevel={tableLevel}
                  />
                );
              })}
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

          return (
            <ReactMarkdown
              components={ChakraUIRenderer()}
              children={children}
            />
          );
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
            (child) => {
              return (
                <SmartFunctionOutput
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
          const defaultElement = (
            defaultElements as {
              [k: string]: (props: Record<string, any>) => JSX.Element;
            }
          )[element];

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
