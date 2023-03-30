import { useEffect } from 'react';
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
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import OrganizationSwitcher from './auth/organizationSwitcher';
import { MobileMenu } from './header-mobile-menu';
import { ZipperSymbol } from '@zipper/ui';
import SignInButton from './auth/signInButton';

type HeaderProps = {
  showNav?: boolean;
  showOrgSwitcher?: boolean;
};

const navRoutes = [
  { href: '/gallery', text: 'Gallery' },
  { href: '#', text: 'Learn' },
  { href: '#', text: 'Build' },
];

const Header: React.FC<HeaderProps> = ({ showNav = true, showOrgSwitcher }) => {
  const router = useRouter();
  const isTablet = useBreakpointValue({ base: false, md: true });
  const baseRoute = router.pathname.split('/')[1];

  const { reload } = router.query;

  useEffect(() => {
    if (reload) {
      window.location.href = window.location.href.replace('?reload=true', '');
    }
  }, [reload]);

  return (
    <>
      <Flex
        as="header"
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
              <SignedIn>
                {showNav ? (
                  <ZipperSymbol style={{ maxHeight: '100%' }} />
                ) : (
                  <ZipperLogo style={{ maxHeight: '100%' }} />
                )}
              </SignedIn>
              <SignedOut>
                <ZipperLogo style={{ maxHeight: '100%' }} />
              </SignedOut>
            </NextLink>
          </Box>

          {showOrgSwitcher && (
            <>
              <Box>
                <SignedIn>
                  <OrganizationSwitcher />
                </SignedIn>
              </Box>
            </>
          )}
        </HStack>
        {showNav && (
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
                color="purple"
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
                      textUnderlineOffset={12}
                      textDecoration={textDecoration}
                      fontSize="md"
                    >
                      {r.text}
                    </Link>
                  );
                })}
              </HStack>
            )}
            <HStack spacing="4" justifyContent="end">
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
              <SignedOut>
                <SignInButton />
              </SignedOut>
            </HStack>
            {!isTablet && <MobileMenu navRoutes={navRoutes} />}
          </Flex>
        )}
      </Flex>
      <Divider pt="4" mb="10" />
    </>
  );
};

export default Header;
