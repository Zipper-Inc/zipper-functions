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
  Heading,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { BLUE, ZipperLogo, ZipperSymbol } from '@zipper/ui';
import OrganizationSwitcher from './auth/organizationSwitcher';
import { MobileMenu } from './header-mobile-menu';
import { useUser } from '~/hooks/use-user';
import SignedIn from './auth/signed-in';
import SignedOut from './auth/signed-out';
import { PiHouseSimple } from 'react-icons/pi';
import { UserProfileButton } from './auth/user-profile-button';
import { FeedbackModal } from './auth/feedback-modal';

type HeaderProps = {
  showNav?: boolean;
  showOrgSwitcher?: boolean;
  showDivider?: boolean;
};

const navRoutes = [
  { href: '/gallery', text: 'Gallery' },
  { href: '/changelog', text: 'Changelog' },
  { href: '/docs', text: 'Docs' },
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
      [
        '/home',
        '/about',
        '/docs',
        '/features',
        '/blog',
        '/home',
        '/terms',
        '/privacy',
      ].find((path) => router.asPath.startsWith(path)),
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

  if (isLanding) {
    return <></>;
  }

  return (
    <>
      <Flex
        as="header"
        gap={4}
        pt="20px"
        maxW="full"
        minW="md"
        paddingX={{ base: '4', md: '10' }}
        justifyContent="center"
      >
        <HStack spacing={3}>
          <Box>
            {isLoaded && (
              <NextLink href="/">
                <SignedIn>
                  {showNav && showOrgSwitcher ? (
                    <HStack spacing={4}>
                      <HStack spacing={2}>
                        <ZipperSymbol
                          fill={BLUE}
                          middle={{ fill: BLUE }}
                          style={{
                            maxHeight: '100%',
                            width: '20px',
                            marginLeft: '5px',
                          }}
                        />

                        <Flex
                          bgColor="blue.50"
                          alignItems="center"
                          px={2}
                          py={1}
                        >
                          <Text
                            fontSize="x-small"
                            textTransform="uppercase"
                            fontWeight="bold"
                            color="indigo.600"
                            cursor="default"
                          >
                            Beta
                          </Text>
                        </Flex>
                      </HStack>

                      <Heading
                        size="md"
                        lineHeight="base"
                        whiteSpace="nowrap"
                        fontWeight="medium"
                        color="fg.400"
                      >
                        /
                      </Heading>
                    </HStack>
                  ) : (
                    <HStack spacing={5}>
                      <ZipperLogo
                        fill={BLUE}
                        height={20}
                        style={{
                          marginLeft: '5px',
                          width: '140px',
                        }}
                      />
                      {showNav && (
                        <HStack
                          spacing={1}
                          display={{ base: 'none', sm: 'flex' }}
                        >
                          <Icon as={PiHouseSimple} />
                          <Text fontSize="sm">Dashboard</Text>
                        </HStack>
                      )}
                    </HStack>
                  )}
                </SignedIn>
                <SignedOut>
                  <ZipperLogo
                    fill={BLUE}
                    height={20}
                    style={{
                      marginLeft: '5px',
                      width: '140px',
                    }}
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
                      color={'fg.900'}
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
                    display={{ base: 'none', md: 'flex' }}
                    onClick={feedbackModal.onOpen}
                  >
                    Feedback
                  </Button>
                  <FeedbackModal {...feedbackModal} />
                </>
              )}
              <UserProfileButton />
            </HStack>
            {!isTablet && (
              <MobileMenu
                navRoutes={navRoutes}
                feedbackModal={user ? feedbackModal : null}
              />
            )}
          </Flex>
        )}
      </Flex>
      {showDivider && <Divider pt="4" mb="10" />}
    </>
  );
};

export default Header;
