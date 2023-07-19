import {
  Box,
  HStack,
  Link,
  Flex,
  useBreakpointValue,
  Divider,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

import { ZipperLogo } from '@zipper/ui';

const navRoutes = [
  { href: '/gallery', text: 'Gallery' },
  { href: '#', text: 'Changelog' },
  { href: '/docs', text: 'Docs' },
];

export const SimpleSiteHeader: React.FC<any> = ({}) => {
  const router = useRouter();
  const isTablet = useBreakpointValue({ base: false, md: true });
  const baseRoute = router.pathname.split('/')[1];

  return (
    <>
      <Flex
        as="nav"
        gap={4}
        pt="20px"
        maxW="full"
        minW="md"
        paddingX={10}
        justifyContent="center"
      >
        <HStack spacing={3} alignItems="start" alignContent={'center'}>
          <Box my={3} height={4}>
            <NextLink href="/">
              <ZipperLogo fill="currentColor" style={{ maxHeight: '100%' }} />
            </NextLink>
          </Box>
        </HStack>

        <Flex
          flex={1}
          justifyContent={isTablet ? 'space-between' : 'end'}
          gap={4}
        >
          {isTablet && (
            <HStack
              height="100%"
              spacing={4}
              fontSize="lg"
              textDecoration="none"
            >
              {navRoutes.map((r) => {
                const isActive = r.href === `/${baseRoute}`;
                const textDecoration = isActive ? 'underline' : 'none';

                return (
                  <Link
                    as={NextLink}
                    href={r.href}
                    key={r.text}
                    color="primary.500"
                    textUnderlineOffset={12}
                    textDecoration={textDecoration}
                    fontSize="sm"
                  >
                    {r.text}
                  </Link>
                );
              })}
            </HStack>
          )}
          {/* !isTablet && <MobileMenu navRoutes={navRoutes} />*/}
        </Flex>
      </Flex>
      <Divider pt="4" />
    </>
  );
};
