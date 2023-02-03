import { useEffect } from 'react';
import {
  Box,
  HStack,
  IconButton,
  Link,
  Flex,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { FiMenu } from 'react-icons/fi';

import { ZipperLogo } from '@zipper/ui';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/nextjs';
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
  const isTablet = useBreakpointValue({ base: false, md: true });
  const baseRoute = router.pathname.split('/')[1];

  const { reload } = router.query;

  useEffect(() => {
    if (reload) {
      window.location.href = window.location.href.replace('?reload=true', '');
    }
  }, [reload]);

  return (
    <Flex
      as="header"
      maxW="full"
      gap={4}
      margin="auto"
      mt="12px"
      maxW="full"
      paddingX={10}
    >
      <HStack spacing={3} alignItems="start">
        <Box mt="12px" height={4}>
          <Link href="/">
            <ZipperLogo style={{ maxHeight: '100%' }} />
          </Link>
        </Box>
        {showNav && (
          <Box>
            <SignedIn>
              <OrganizationSwitcher />
            </SignedIn>
          </Box>
        )}
      </HStack>
      {showNav && (
        <Flex flex={1} justifyContent="space-between">
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
          {isTablet ? (
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
        </Flex>
      )}
    </Flex>
  );
};

export default Header;
