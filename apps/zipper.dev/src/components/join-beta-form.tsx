import { Button, Flex, Link } from '@chakra-ui/react';

export default function JoinBetaForm({ onOpen }: { onOpen: VoidFunction }) {
  return (
    <Flex gap={4}>
      <Button
        as={Link}
        height="2.75rem"
        minWidth={{ base: '7rem', md: '138px' }}
        fontSize={{ base: 'sm', md: 'md' }}
        bg="brandOrange.500"
        padding={{ base: '5px 8px', md: '10px 18px' }}
        color="white"
        fontWeight={500}
        _hover={{ background: 'brandOrange.700', textDecor: 'none' }}
        href="/auth/signup"
        rounded="sm"
        isExternal
      >
        Join the beta
      </Button>
      <Button
        variant="outline"
        height="2.75rem"
        fontWeight="400"
        onClick={onOpen}
      >
        {'Watch demo (3 min)'}
      </Button>
    </Flex>
  );
}
