import {
  useDisclosure,
  Heading,
  Button,
  Collapse,
  Box,
  Text,
  HStack,
} from '@chakra-ui/react';
import styled from '@emotion/styled';
import { HiChevronRight } from 'react-icons/hi';
import { SmartFunctionOutput } from './smart-function-output';
import { isPrimitive } from './utils';

const StyledButton = styled(Button)`
  &[data-expanded='false'] svg {
    animation: 'rotate-expand' 50ms both;
  }
  &[data-expanded='true'] svg {
    animation: 'rotate-collapse' 50ms both;
  }

  @keyframes rotate-expand {
    from {
      transform: rotate(-90deg);
    }
    to {
      transform: rotate(0deg);
    }
  }
  @keyframes rotate-collapse {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(-90deg);
    }
  }
`;

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
    <HStack
      borderBottom="1px solid"
      borderColor="gray.200"
      spacing={4}
      alignItems="start"
      _last={{ borderBottom: 'none' }}
    >
      <HStack
        flex={1}
        minWidth={0}
        overflow="auto"
        whiteSpace="nowrap"
        justifyContent="space-between"
      >
        <Heading py={6} size="md" mb={1} color="gray.600" fontWeight={300}>
          {heading}
        </Heading>
        {shouldCollapse && (
          <StyledButton
            variant="ghost"
            size="xs"
            mx={2}
            onClick={onToggle}
            data-expanded={isOpen}
          >
            <HiChevronRight />
          </StyledButton>
        )}
      </HStack>
      {shouldCollapse ? (
        <Box flex={5}>
          <Collapse in={isOpen}>
            <SmartFunctionOutput result={data} level={level + 1} />
          </Collapse>
        </Box>
      ) : (
        <Text py={6} size="sm" flex={5}>
          {data.toString()}
        </Text>
      )}
    </HStack>
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
        <ObjectExplorerRow
          key={key}
          heading={key}
          data={data[key]}
          level={level}
        />
      ))}
    </Box>
  );
}
