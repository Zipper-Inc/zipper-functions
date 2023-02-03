import {
  Box,
  Button,
  GridItem,
  HStack,
  IconButton,
  Link,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { FiMenu } from 'react-icons/fi';

import DefaultGrid from './default-grid';
import { ZipperLogo } from '@zipper/ui';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
import { useEffect } from 'react';
import OrganizationSwitcher from './auth/organizationSwitcher';

type HeaderProps = {
  showNav?: boolean;
};

const navRoutes = [
  { href: '/gallery', text: 'Gallery' },
  { href: '#', text: 'Learn' },
  { href: '#', text: 'Build' },
];

const Header: React.FC<HeaderProps> = ({ showNav = true }) => {
  const router = useRouter();
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const baseRoute = router.pathname.split('/')[1];

  const { reload } = router.query;

  useEffect(() => {
    if (reload) {
      window.location.href = window.location.href.replace('?reload=true', '');
    }
  }, [reload]);

  return (
    <DefaultGrid as="header" paddingTop="12px" maxW="full">
      <GridItem
        as={Box}
        colSpan={showNav ? 3 : 12}
        ml={showNav ? 'unset' : 'auto'}
        mr={showNav ? 'unset' : 'auto'}
      >
        <Button
          type="button"
          onClick={() => router.push('/')}
          variant="unstyled"
        >
          <HStack spacing={3} height="100%">
            <Box height="4">
              <ZipperLogo style={{ maxHeight: '100%' }} />
            </Box>
            {showNav && (
              <Box>
                <SignedIn>
                  <OrganizationSwitcher />
                </SignedIn>
              </Box>
            )}
          </HStack>
        </Button>
      </GridItem>

      {showNav && (
        <>
          <GridItem colSpan={3} as="nav">
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
                  >
                    {r.text}
                  </Link>
                );
              })}
            </HStack>
          </GridItem>
          <GridItem colSpan={6} as="nav">
            {isDesktop ? (
              <HStack spacing="4" justifyContent="end">
                <SignedIn>
                  <UserButton />
                </SignedIn>
                <SignedOut>
                  {/* Signed out users get sign in button */}
                  <SignInButton />
                </SignedOut>
              </HStack>
            ) : (
              <IconButton
                variant="ghost"
                icon={<FiMenu fontSize="1.25rem" />}
                aria-label="Open Menu"
              />
            )}
          </GridItem>
        </>
      )}
    </DefaultGrid>
  );
};

export default Header;
