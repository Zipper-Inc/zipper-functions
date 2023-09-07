import {
  Button,
  HStack,
  Input,
  Text,
  VStack,
  Box,
  Link,
  Flex,
} from '@chakra-ui/react';

import { ZipperLogo, ZipperSymbol } from '@zipper/ui';
import { baseColors } from '@zipper/ui';

export default function Footer() {
  const { blue } = baseColors;
  return (
    <VStack w="full" as="footer">
      <VStack
        as="section"
        aria-label="Subscription"
        bgColor="purple.900"
        w="full"
        p="100px 0"
        align="center"
        justify="center"
        gap={10}
      >
        <HStack as="article" maxW="352px" align="center" gap={9}>
          <ZipperLogo type="horizontal" />
          <Text
            style={{ margin: 0 }}
            color="white"
            fontSize="2xl"
            fontWeight={600}
            maxWidth="190px"
          >
            Built for people who like to ship.
          </Text>
        </HStack>
        <HStack
          as="form"
          aria-label="Subscription form"
          maxW="352px"
          justify="center"
          align="center"
          gap={2}
        >
          <Input
            height="2.75rem"
            width={{ base: 'full', md: '20rem' }}
            borderRadius="8px"
            bg="white"
            variant="outline"
            placeholder="Email address"
            borderColor="gray.300"
            fontSize="md"
            color="gray.500"
          />
          <Button
            height="2.75rem"
            minWidth="138px"
            fontSize="md"
            borderRadius="8px"
            bg="brandOrange.500"
            padding="10px 18px"
            color="white"
            fontWeight={500}
            _hover={{ background: 'brandOrange.700' }}
          >
            Join the beta
          </Button>
        </HStack>
      </VStack>
      <VStack
        as="section"
        p={['52px 24px', '100px 130px']}
        bgColor="neutral.100"
        w="full"
        align="center"
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
        <Flex
          zIndex={1}
          w="full"
          align="start"
          direction={{ base: 'column', lg: 'row' }}
          maxW={{ lg: 'container.xl' }}
          justifyContent="space-between"
          gap={{ base: 10, lg: 5 }}
        >
          <ZipperSymbol fill={`${blue[600]}`} />

          <HStack as="nav" aria-label="Quick links" gap={5}>
            <VStack
              as="ul"
              w={{ base: '178px', lg: '280px' }}
              align="flex-start"
            >
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

            <VStack as="ul" align="flex-start">
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
          </HStack>

          <HStack
            h={{ lg: 'full' }}
            w={{ base: 'full', lg: 'auto' }}
            align="end"
            justify="end"
          >
            <Text fontSize="xs" as="span" color="neutral.600">
              &copy; 2023 Zipper, Inc. All rights reserved.
            </Text>
          </HStack>
        </Flex>
      </VStack>
    </VStack>
  );
}
