import {
  Box,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import { ZipperLogo } from '../zipper-logo';
import { ZipperSymbol } from '../zipperSymbol';
import { WebSiteSubscriptionForm } from './common/Subscription';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */

const DEMO_DESCRIPTION = 'Quickly build interactive apps, just like this:';

const LINKS = [
  { label: 'Home', href: '/home' },
  { label: 'Features', href: '/features' },
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Careers', href: '/careers' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'Sign In', href: '/sign-in' },
];

/* -------------------------------------------- */
/* Components                                   */
/* -------------------------------------------- */

const AppletDemo = () => {
  return (
    <Flex
      as="section"
      align="center"
      bg="purple.900"
      w="full"
      gap={10}
      py={[25]}
    >
      <Container as="main" maxW="container.xl" w="full" centerContent gap={10}>
        <Text fontSize="2xl" fontWeight={600} color="white">
          {DEMO_DESCRIPTION}
        </Text>
        <HStack as="figure" w="full" justify="space-between">
          <Center as="figure" flex={1}>
            {/* <ZipperLogo type="sliced" style={{ width: 430, height: 166 }} /> */}
          </Center>
          {/* <Applet /> */}
        </HStack>
      </Container>
    </Flex>
  );
};

export const WebSiteFooter = () => {
  return (
    <VStack align="center" as="footer" w="full">
      <AppletDemo />

      {/** footer nav */}
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
        <Container
          as={Grid}
          zIndex={1}
          w="full"
          gridTemplateColumns={{ base: '1fr', lg: 'repeat(4, 1fr)' }}
          gridTemplateRows={['148px']}
          maxW="container.xl"
          justifyContent="space-between"
          gap={{ base: 10, lg: 5 }}
        >
          <VStack
            align="start"
            justify="space-between"
            as={GridItem}
            colSpan={1}
            h="full"
          >
            <ZipperSymbol fill="#1174CB" />
            <Text fontSize="xl" color="blue.600" fontWeight={600}>
              Built for people <br /> who like to ship
            </Text>
          </VStack>

          <HStack
            as={GridItem}
            colSpan={{ base: 1, lg: 2 }}
            aria-label="Quick links"
            gap={5}
          >
            <VStack
              as="ul"
              flex={1}
              h="full"
              justify="space-between"
              align="flex-start"
            >
              {LINKS.slice(0, 4).map((link) => (
                <Link key={link.href} color="blue.600" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </VStack>

            <VStack
              as="ul"
              flex={1}
              h="full"
              justify="space-between"
              align="flex-start"
            >
              {LINKS.slice(4, 9).map((link) => (
                <Link key={link.href} color="blue.600" href={link.href}>
                  {link.label}
                </Link>
              ))}
            </VStack>
          </HStack>

          <VStack as={GridItem} colSpan={1} align="end" justify="space-between">
            <WebSiteSubscriptionForm gap={2} />
            <Text fontSize="xs" as="span" color="neutral.600">
              &copy; 2023 Zipper, Inc. All rights reserved.
            </Text>
          </VStack>
        </Container>
      </VStack>
    </VStack>
  );
};
