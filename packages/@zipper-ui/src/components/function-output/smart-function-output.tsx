import { Box, Link, Stack, StackDivider } from '@chakra-ui/react';
import { OutputType } from '@zipper/types';

import React from 'react';
import dynamic from 'next/dynamic';

import { defaults as defaultElements } from '../../utils/chakra-markdown-renderer';
import { ActionComponent } from './action-component';
import Array from './array';
import Collection from './collection';
import { HtmlOutput } from './html-output';
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
  const { config, runHistoryUrl } = useSmartFunctionOutputContext();

  // if result === 0, it'll be evaluated as falsey by !result
  if (result === undefined || result === null) return null;

  if (
    window.location.href.includes('zipper.dev') ||
    window.location.href.includes('localhost')
  ) {
    const len = JSON.stringify(result || {}).length;
    if (len > 20000) {
      return (
        <>
          <p>
            Too large to preview inline. Open in a{' '}
            <Link target="_new" href={runHistoryUrl} textDecor="underline">
              new tab
            </Link>
            .
          </p>
        </>
      );
    }
  }

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
      return <HtmlOutput config={config} data={data} />;

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
        case 'barChart': {
          const ResponsiveBar = dynamic(
            () => import('@nivo/bar').then((m) => m.ResponsiveBar),
            { ssr: true },
          );

          return (
            <Box height={component.props.boxHeight || '400px'}>
              <ResponsiveBar
                keys={Object.keys(component.props.data[0] || {}).filter(
                  (k: any) => k !== 'id',
                )}
                margin={{ top: 50, right: 130, bottom: 50, left: 60 }}
                padding={0.3}
                valueScale={{ type: 'linear' }}
                indexScale={{ type: 'band', round: true }}
                colors={{ scheme: 'nivo' }}
                borderColor={{
                  from: 'color',
                  modifiers: [['darker', 1.6]],
                }}
                axisTop={null}
                axisRight={null}
                labelSkipWidth={12}
                labelSkipHeight={12}
                labelTextColor={{
                  from: 'color',
                  modifiers: [['darker', 1.6]],
                }}
                legends={[
                  {
                    dataFrom: 'keys',
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 120,
                    translateY: 0,
                    itemsSpacing: 2,
                    itemWidth: 100,
                    itemHeight: 20,
                    itemDirection: 'left-to-right',
                    itemOpacity: 0.85,
                    symbolSize: 20,
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                {...component.props}
                axisBottom={{
                  legendOffset: 36,
                  legendPosition: 'middle',
                  ...component.props?.axisBottom,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legendOffset: -40,
                  legendPosition: 'middle',
                  ...component.props?.axisLeft,
                }}
              />
            </Box>
          );
        }
        case 'lineChart': {
          const ResponsiveLine = dynamic(
            () => import('@nivo/line').then((m) => m.ResponsiveLine),
            { ssr: true },
          );

          return (
            <Box height={component.props.boxHeight || '400px'}>
              <ResponsiveLine
                margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                  stacked: true,
                  reverse: false,
                }}
                yFormat=" >-.2f"
                axisTop={null}
                axisRight={null}
                pointSize={10}
                pointColor={{ theme: 'background' }}
                pointBorderWidth={2}
                pointBorderColor={{ from: 'serieColor' }}
                pointLabelYOffset={-12}
                useMesh={true}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'column',
                    justify: false,
                    translateX: 100,
                    translateY: 0,
                    itemsSpacing: 0,
                    itemDirection: 'left-to-right',
                    itemWidth: 80,
                    itemHeight: 20,
                    itemOpacity: 0.75,
                    symbolSize: 12,
                    symbolShape: 'circle',
                    symbolBorderColor: 'rgba(0, 0, 0, .5)',
                    effects: [
                      {
                        on: 'hover',
                        style: {
                          itemBackground: 'rgba(0, 0, 0, .03)',
                          itemOpacity: 1,
                        },
                      },
                    ],
                  },
                ]}
                {...component.props}
                axisBottom={{
                  legendOffset: 36,
                  legendPosition: 'middle',
                  ...component.props?.axisBottom,
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legendOffset: -40,
                  legendPosition: 'middle',
                  ...component.props?.axisLeft,
                }}
              />
            </Box>
          );
        }
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
