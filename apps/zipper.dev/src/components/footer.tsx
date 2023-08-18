import {
  Button,
  HStack,
  Input,
  Text,
  VStack,
  Box,
  Link,
} from '@chakra-ui/react';

import { ZipperLogo, ZipperSymbol } from '@zipper/ui';
import { baseColors } from '@zipper/ui';

export default function Footer() {
  const { blue } = baseColors;
  return (
    <VStack w="full">
      <HStack
        minH={365}
        bgColor="purple.900"
        w="full"
        display="flex"
        justify="center"
        flexDirection="column"
        gap={12}
      >
        <VStack display="flex" flexDirection="row" gap={8}>
          <ZipperLogo type="horizontal" />
          <Text color="white" fontSize="2xl" fontWeight="bold" maxWidth="190px">
            Built for people who like to ship.
          </Text>
        </VStack>
        <VStack display="flex" flexDirection="row" gap={4}>
          <Input bgColor="white" type="text" placeholder="E-mail address" />
          <Button colorScheme="red" px={6} mt="0 !important">
            <Text fontSize="sm">Join the beta</Text>
          </Button>
        </VStack>
      </HStack>
      <HStack
        minH={348}
        bgColor="neutral.100"
        w="full"
        mt="0 !important"
        position="relative"
      >
        <Box
          position="absolute"
          left="0"
          top="0"
          w="0"
          h="0"
          borderBottom="200px solid transparent"
          zIndex={0}
          borderLeft="200px solid white"
        />
        <VStack
          zIndex={1}
          display="flex"
          flexDirection="row"
          w="full"
          justifyContent="space-between"
          px={12}
        >
          <Box alignSelf="flex-start">
            <VStack align="flex-start">
              <ZipperSymbol fill={`${blue[600]}`} />
            </VStack>
          </Box>

          <Box>
            <VStack align="flex-start">
              <Link color="blue.600" href="/home">
                Home
              </Link>
              <Link color="blue.600" href="#">
                Features
              </Link>
              <Link color="blue.600" href="#">
                Docs
              </Link>
              <Link color="blue.600" href="#">
                Blog
              </Link>
            </VStack>
          </Box>

          <Box>
            <VStack align="flex-start">
              <Link color="blue.600" href="#">
                Careers
              </Link>
              <Link color="blue.600" href="#">
                About
              </Link>
              <Link color="blue.600" href="#">
                Contact
              </Link>
              <Link color="blue.600" href="#">
                Sign In
              </Link>
            </VStack>
          </Box>

          <Box>
            <VStack align="flex-start">
              <Text fontSize="xs" color="neutral.600">
                &copy; 2023 Zipper, Inc. All rights reserved.
              </Text>
            </VStack>
          </Box>
        </VStack>
      </HStack>
    </VStack>
  );
}
