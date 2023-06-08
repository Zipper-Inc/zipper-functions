import { Box, Flex, Stack, StackDivider, Link } from '@chakra-ui/react';
import { OutputType } from '@zipper/types';
import ReactMarkdown from 'react-markdown';

import { ObjectExplorer } from './object-explorer';
import { parseResult } from './utils';
import { RawFunctionOutput } from './raw-function-output';
import { ActionComponent } from './action-component';
import { RouterComponent } from './router-component';
import Collection from './collection';
import Array from './array';
import ChakraUIRenderer from '../../utils/chakra-markdown-renderer';

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

    case OutputType.Component: {
      const component = data as Zipper.Component;

      switch (component.type) {
        case 'stack': {
          return (
            <Stack
              {...component.props}
              divider={
                component.props.divider ? (
                  <StackDivider borderColor="gray.200" />
                ) : undefined
              }
              spacing={component.props.direction === 'row' ? 6 : 4}
            >
              {component.children.map((child) => {
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
        default:
          break;
      }
    }

    case OutputType.Router:
      return <RouterComponent route={data} />;

    case OutputType.ActionArray:
      return (
        <Flex direction="row">
          {data.map((action: any) => (
            <ActionComponent action={action} />
          ))}
        </Flex>
      );

    default:
      return <RawFunctionOutput result={result} />;
  }
}
