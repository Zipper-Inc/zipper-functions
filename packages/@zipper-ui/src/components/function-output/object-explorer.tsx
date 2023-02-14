import {
  useDisclosure,
  Heading,
  Button,
  Collapse,
  Box,
  Text,
} from '@chakra-ui/react';
import { SmartFunctionOutput } from './smart-function-output';
import { isPrimitive } from './utils';

function ObjectExplorerRow({
  heading,
  data,
  level,
}: {
  heading: string;
  data: any;
  level: number;
}) {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: true });
  const shouldCollapse = !isPrimitive(data);

  return (
    <Box my={6}>
      <Heading size="md" mb={1} color="gray.600" fontWeight={300}>
        {heading}
        {shouldCollapse && (
          <Button variant="ghost" size="xs" mx={2} onClick={onToggle}>
            {!isOpen ? '〉' : '⌃'}
          </Button>
        )}
      </Heading>
      {shouldCollapse ? (
        <Collapse in={isOpen}>
          <Box pl={4}>
            <SmartFunctionOutput result={data} level={level + 1} />
          </Box>
        </Collapse>
      ) : (
        <Text size="sm">{data.toString()}</Text>
      )}
    </Box>
  );
}

export function ObjectExplorer({
  data,
  level,
}: {
  data: Record<string, any>;
  level: number;
}) {
  return (
    <Box>
      {Object.keys(data).map((key) => (
        <ObjectExplorerRow heading={key} data={data[key]} level={level} />
      ))}
    </Box>
  );
}
