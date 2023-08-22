import { useEffect, useMemo } from 'react';
import {
  Box,
  HStack,
  Link,
  Flex,
  useBreakpointValue,
  Divider,
  Button,
  useDisclosure,
  Text,
  Icon,
  ChakraProps,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

import { ZipperLogo } from '@zipper/ui';
import OrganizationSwitcher from './auth/organizationSwitcher';
import { MobileMenu } from './header-mobile-menu';
import { ZipperSymbol } from '@zipper/ui';
import { useUser } from '~/hooks/use-user';
import SignedIn from './auth/signed-in';
import SignedOut from './auth/signed-out';
import { HiHome } from 'react-icons/hi2';
import { UserProfileButton } from './auth/user-profile-button';
import { FeedbackModal } from './auth/feedback-modal';

type HeaderProps = {
  showNav?: boolean;
  showOrgSwitcher?: boolean;
  showDivider?: boolean;
};

const navRoutes = [
  { href: '/gallery', text: 'Gallery' },
  { href: '#', text: 'Changelog' },
  { href: '/docs', text: 'Docs' },
];

const landingRoutes = [
  { href: '/feature', label: 'Feature' },
  { href: '/docs', label: 'Docs' },
  { href: '/blog', label: 'Blogs' },
  { href: '/about', label: 'About' },
];

const Header: React.FC<HeaderProps> = ({
  showNav = true,
  showDivider = true,
  showOrgSwitcher,
}) => {
  const router = useRouter();
  const isTablet = useBreakpointValue({ base: false, md: true });
  const baseRoute = router.pathname.split('/')[1];

  const isLanding = useMemo(
    () =>
      ['/about', '/features', '/blog', '/about', '/home'].includes(
        router.asPath,
      ) || router.asPath === '/',
    [router.asPath],
  );

  const activeLink = useMemo(
    () => landingRoutes.find((link) => link.href === router.asPath),
    [router.asPath],
  );

  const { reload } = router.query;
  const { user, isLoaded } = useUser();

  const feedbackModal = useDisclosure();

  useEffect(() => {
    if (reload) {
      window.location.href = window.location.href.replace('?reload=true', '');
    }
  }, [reload]);

  const linkStyles: Record<string, ChakraProps> = {
    active: {
      fontWeight: 'semibold',
      color: 'blue.500',
      _hover: {
        color: 'blue.400',
      },
    },
    idle: {
      fontSize: 'medium',
      fontWeight: 'normal',
      color: 'gray.600',
      _hover: {
        color: 'blue.500',
        textDecoration: 'none',
      },
    },
  };

  if (isLanding) {
    return (
      <Flex
        align="center"
        as="header"
        css={{ margin: '0 auto' }}
        justify="space-between"
        height={20}
        w="full"
        maxW="container.xl"
      >
        <Box
          position="absolute"
          top="-25%"
          width="100vw"
          height="1400px"
          right="0"
          zIndex="-1"
          background="url('/layout/triangle-path.svg')"
          backgroundSize="cover"
        />
        <ZipperLogo type="color" />
        <HStack as="nav" gap={8}>
          {landingRoutes.map((link, index) => {
            const styles =
              activeLink?.href === link.href
                ? { ...linkStyles.active, ...linkStyles.idle }
                : linkStyles.idle;

            return (
              <Link key={index} href={link.href} {...styles}>
                {link.label}
              </Link>
            );
          })}
          <Button colorScheme="gray" variant="outline">
            Sign Up
          </Button>
        </HStack>
      </Flex>
    );
  }

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
            {isLoaded && (
              <NextLink href="/">
                <SignedIn>
                  {showNav && showOrgSwitcher ? (
                    <ZipperSymbol
                      fill="currentColor"
                      style={{ maxHeight: '100%' }}
                    />
                  ) : (
                    <HStack spacing={5}>
                      <ZipperLogo
                        fill="currentColor"
                        style={{ maxHeight: '20px' }}
                      />
                      {showNav && (
                        <HStack spacing={1}>
                          <Icon as={HiHome} />
                          <Text fontSize="sm">Dashboard</Text>
                        </HStack>
                      )}
                    </HStack>
                  )}
                </SignedIn>
                <SignedOut>
                  <ZipperLogo
                    fill="currentColor"
                    style={{ maxHeight: '100%' }}
                  />
                </SignedOut>
              </NextLink>
            )}
          </Box>

          {showOrgSwitcher && (
            <>
              <Box>
                <SignedIn>
                  <HStack>
                    <OrganizationSwitcher
                      border="none"
                      variant="unstyled"
                      fontSize="xl"
                      overflow="auto"
                      whiteSpace="nowrap"
                      fontWeight="medium"
                      color="textAlt"
                    />
                  </HStack>
                </SignedIn>
              </Box>
            </>
          )}
        </HStack>
        {showNav && isLoaded && (
          <Flex
            flex={1}
            justifyContent={isTablet && !user ? 'space-between' : 'end'}
            gap={4}
          >
            {isTablet && (
              <HStack
                height="100%"
                spacing={4}
                fontSize="lg"
                color={user ? 'textAlt' : 'purple'}
                textDecorationColor="purple"
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
                      fontSize="sm"
                    >
                      {r.text}
                    </Link>
                  );
                })}
              </HStack>
            )}
            <HStack spacing="4" justifyContent="end">
              {user && (
                <>
                  <Button
                    size="sm"
                    variant={'outline'}
                    color="textAlt"
                    onClick={feedbackModal.onOpen}
                  >
                    Feedback
                  </Button>
                  <FeedbackModal {...feedbackModal} />
                </>
              )}
              <UserProfileButton />
            </HStack>
            {!isTablet && <MobileMenu navRoutes={navRoutes} />}
          </Flex>
        )}
      </Flex>
      {showDivider && <Divider pt="4" mb="10" />}
    </>
  );
};

export default Header;
