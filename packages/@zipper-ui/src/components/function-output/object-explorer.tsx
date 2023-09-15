import {
  useDisclosure,
  Button,
  Collapse,
  Box,
  Text,
  TableContainer,
  Thead,
  Tr,
  Th,
  Tbody,
  Table,
  Td,
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
  const shouldAutoOpen =
    level <= AUTO_OPEN_MAX_LEVELS_DEEP &&
    tableLevel <= AUTO_OPEN_MAX_LEVELS_DEEP &&
    Object.keys(data || {}).length <= AUTO_OPEN_MAX_ITEMS;

  const { isOpen, onToggle } = useDisclosure({
    defaultIsOpen: shouldAutoOpen || !collapse,
  });
  const shouldCollapse = !isPrimitive(data) && data && !data['$zipperType'];
  return (
    <Tr
      borderBottom="1px"
      borderColor="fg.200"
      _last={{ borderBottom: 'none' }}
      verticalAlign="top"
    >
      <Td border={'none'} p="0">
        {shouldCollapse ? (
          <Button
            variant="link"
            display="flex"
            size="md"
            pl={0}
            pr={4}
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
            {headingMode === HeadingMode.ExpandableTableCell && (
              <Text size="xs" color="fg.500" fontWeight={300}>
                {!isOpen ? `Expand ${heading}` : `Collapse`}
              </Text>
            )}
            <Box
              transitionDuration="100ms"
              transform={isOpen ? 'rotate(90deg)' : 'none'}
              color="fg.600"
              justifySelf="right"
              ml="auto"
            >
              <PiCaretRight />
            </Box>
          </Button>
        ) : (
          <Text py={ROW_PADDING} size="sm" color="fg.600" fontWeight={300}>
            {heading}
          </Text>
        )}
      </Td>
      <Td border="none" p={0} pl={4}>
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
                  : Object.keys(data || {}).join(', ')}
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
              result={data || 'ㅤ'}
              level={level + 1}
              tableLevel={tableLevel + 1}
            />
            {/* <Text size="sm" whiteSpace="normal" textAlign="right">
              {data?.toString() || 'null'}
            </Text> */}
          </Flex>
        )}
      </Td>
    </Tr>
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
  if (heading && expandable) {
    return (
      <ObjectExplorerRow
        key={heading}
        heading={heading}
        data={data}
        level={level + 1}
        tableLevel={tableLevel + 1}
        collapse={Object.keys(data || {}).length > 1}
        headingMode={HeadingMode.ExpandableTableCell}
      />
    );
  }

  return (
    <TableContainer w="100%" position="relative">
      <Table height="fit-content">
        <Thead display="none">
          <Tr>
            <Th width="max-content"></Th>
            <Th width="auto"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.keys(data || {}).map((key) => (
            <ObjectExplorerRow
              key={key}
              heading={key}
              data={data[key]}
              level={level}
              tableLevel={tableLevel}
              collapse={Object.keys(data || {}).length > 1}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
