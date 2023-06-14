import {
  useDisclosure,
  Button,
  Collapse,
  Box,
  Text,
  HStack,
  TableContainer,
  Thead,
  Tr,
  Th,
  Tbody,
  Table,
  Td,
} from '@chakra-ui/react';
import { HiChevronRight } from 'react-icons/hi';
import { SmartFunctionOutput } from './smart-function-output';
import { isPrimitive } from './utils';

function ObjectExplorerRow({
  heading,
  data,
  level,
  tableLevel,
}: {
  heading: string;
  data: any;
  level: number;
  tableLevel: number;
}) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const shouldCollapse = !isPrimitive(data);
  return (
    <Tr
      borderBottom="1px"
      borderColor="gray.200"
      _last={{ borderBottom: 'none' }}
    >
      <Td border={'none'} p="0">
        <HStack
          flex={1}
          flexBasis={'auto'}
          minW="200px"
          overflow="auto"
          whiteSpace="nowrap"
          justifyContent="space-between"
        >
          <Text py={6} size="sm" color="gray.600" fontWeight={300}>
            {heading}
          </Text>
          {shouldCollapse && (
            <Button
              variant="ghost"
              size="xs"
              onClick={onToggle}
              minWidth="unset"
            >
              <Box
                transitionDuration="100ms"
                transform={isOpen ? 'rotate(-90deg)' : 'none'}
              >
                <HiChevronRight />
              </Box>
            </Button>
          )}
        </HStack>
      </Td>
      <Td border="none">
        {shouldCollapse ? (
          <Box flex={5}>
            {!isOpen && (
              <Text py={6} color="gray.400">
                {Object.keys(data).join(', ')}
              </Text>
            )}
            <Collapse in={isOpen}>
              <SmartFunctionOutput
                result={data}
                level={level + 1}
                tableLevel={tableLevel + 1}
              />
            </Collapse>
          </Box>
        ) : (
          <Box flex={5}>
            <Text size="sm" whiteSpace="normal" textAlign="right">
              {data.toString()}
            </Text>
          </Box>
        )}
      </Td>
    </Tr>
  );
}

export function ObjectExplorer({
  data,
  level,
  tableLevel,
}: {
  data: Record<string, any>;
  level: number;
  tableLevel: number;
}) {
  return (
    <TableContainer w="full">
      <Table>
        <Thead display="none">
          <Tr>
            <Th width="max-content"></Th>
            <Th width="auto"></Th>
          </Tr>
        </Thead>
        <Tbody>
          {Object.keys(data).map((key) => (
            <ObjectExplorerRow
              key={key}
              heading={key}
              data={data[key]}
              level={level}
              tableLevel={tableLevel}
            />
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );
}
