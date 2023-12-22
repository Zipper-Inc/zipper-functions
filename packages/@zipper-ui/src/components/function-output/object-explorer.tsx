import './table.css';
import {
  useDisclosure,
  Button,
  Collapse,
  Box,
  Text,
  Flex,
} from '@chakra-ui/react';
import { PiCaretRight } from 'react-icons/pi';
import { SmartFunctionOutput } from './smart-function-output';
import { isPrimitive } from './utils';

const AUTO_OPEN_MAX_LEVELS_DEEP = 2;
const AUTO_OPEN_MAX_ITEMS = 5;
const ROW_PADDING = 6;

export enum HeadingMode {
  ObjectProperty,
  ExpandableTableCell,
}

function getMaxKeys(obj: Record<string, any>): number {
  let maxKeys = Object.keys(obj || {}).length;

  for (const key in obj) {
    if (obj.hasOwnProperty(key) && typeof obj[key] === 'object') {
      const childMaxKeys = getMaxKeys(obj[key]);
      maxKeys = Math.max(maxKeys, childMaxKeys);
    }
  }

  return maxKeys;
}

export function ObjectExplorerRow({
  heading,
  data,
  level,
  tableLevel,
  collapse,
  headingMode = HeadingMode.ObjectProperty,
}: {
  heading: string;
  data: any;
  level: number;
  tableLevel: number;
  collapse: boolean;
  headingMode?: HeadingMode;
}) {
  const dataWithoutNull = data || {};
  const shouldAutoOpen =
    level <= AUTO_OPEN_MAX_LEVELS_DEEP &&
    tableLevel <= AUTO_OPEN_MAX_LEVELS_DEEP &&
    Object.keys(dataWithoutNull).length <= AUTO_OPEN_MAX_ITEMS;

  const maxKeys = getMaxKeys(dataWithoutNull);

  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: shouldAutoOpen || !collapse,
  });
  const shouldCollapse = !isPrimitive(data) && data && !data['$zipperType'];

  return (
    <tr>
      <td>
        {shouldCollapse ? (
          <Button
            variant="link"
            display="flex"
            size="md"
            pl={0}
            pr={1}
            onClick={onToggle}
            minWidth="unset"
            justifyContent="start"
            alignSelf="start"
            justifySelf="start"
            width="100%"
            gap={4}
            _hover={{
              textDecoration: 'none',
            }}
            position="sticky"
            top={0}
          >
            {headingMode === HeadingMode.ObjectProperty && (
              <Text py={ROW_PADDING} size="sm" color="fg.600" fontWeight={300}>
                {heading}
              </Text>
            )}
            <Box
              transitionDuration="100ms"
              transform={isOpen ? 'rotate(90deg)' : 'none'}
              display={maxKeys > 1 ? 'flex' : 'none'}
              color="fg.600"
              justifySelf="right"
              ml="auto"
              pt={1}
            >
              <PiCaretRight />
            </Box>
          </Button>
        ) : (
          <Text py={ROW_PADDING} size="sm" color="fg.600" fontWeight={300}>
            {heading}
          </Text>
        )}
      </td>
      <td>
        {shouldCollapse ? (
          <Flex
            height="100%"
            align="center"
            marginTop={
              headingMode === HeadingMode.ExpandableTableCell &&
              tableLevel > 0 &&
              isOpen
                ? -ROW_PADDING
                : undefined
            }
          >
            {!isOpen && (
              <Text
                color="fg.400"
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
                maxW="421px"
              >
                {Array.isArray(data)
                  ? data.length === 1
                    ? `${data.length} item`
                    : `${data.length} items`
                  : Object.keys(dataWithoutNull).join(', ')}
              </Text>
            )}
            <Collapse in={isOpen}>
              <SmartFunctionOutput
                result={data}
                level={level + 1}
                tableLevel={tableLevel + 1}
              />
            </Collapse>
          </Flex>
        ) : (
          <Flex height="100%" flex={5} align="center">
            <SmartFunctionOutput
              // this is a hack to make sure there's an empty character since tables hate empty cells
              // the character is U+3164
              result={data === undefined || data === null ? 'ㅤ' : data}
              level={level + 1}
              tableLevel={tableLevel + 1}
            />
          </Flex>
        )}
      </td>
    </tr>
  );
}

export function ObjectExplorer({
  data,
  level,
  tableLevel,
  heading,
  expandable = !!level,
}: {
  data: Record<string, any>;
  level: number;
  tableLevel: number;
  heading?: string;
  expandable?: boolean;
}) {
  const dataWithoutNull = data || {};
  if (heading && expandable) {
    return (
      <ObjectExplorerRow
        key={heading}
        heading={heading}
        data={data}
        level={level + 1}
        tableLevel={tableLevel + 1}
        collapse={Object.keys(dataWithoutNull).length > 1}
        headingMode={HeadingMode.ExpandableTableCell}
      />
    );
  }

  return (
    <div>
      <table>
        <tbody>
          {Object.keys(dataWithoutNull).map((key) => (
            <ObjectExplorerRow
              key={key}
              heading={key}
              data={data[key]}
              level={level}
              tableLevel={tableLevel}
              collapse={Object.keys(dataWithoutNull).length > 1}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
