import {
  useDisclosure,
  Heading,
  Button,
  Collapse,
  Box,
  Text,
  HStack,
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
    <HStack
      borderBottom="1px solid"
      borderColor="gray.200"
      spacing={4}
      alignItems="start"
      _last={{ borderBottom: 'none' }}
    >
      <HStack
        flex={1}
        flexBasis={'auto'}
        minW="100px"
        overflow="auto"
        whiteSpace="nowrap"
        justifyContent="space-between"
      >
        <Heading py={6} size="sm" color="gray.600" fontWeight={300}>
          {heading}
        </Heading>
        {shouldCollapse && (
          <Button variant="ghost" size="xs" onClick={onToggle} minWidth="unset">
            <Box
              transitionDuration="100ms"
              transform={isOpen ? 'rotate(-90deg)' : 'none'}
            >
              <HiChevronRight />
            </Box>
          </Button>
        )}
      </HStack>
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
          <Text
            py={6}
            size="sm"
            maxW={'md'}
            whiteSpace="normal"
            textAlign="right"
          >
            {data.toString()}
          </Text>
        </Box>
      )}
    </HStack>
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
    <Box>
      {Object.keys(data).map((key) => (
        <ObjectExplorerRow
          key={key}
          heading={key}
          data={data[key]}
          level={level}
          tableLevel={tableLevel}
        />
      ))}
    </Box>
  );
}
