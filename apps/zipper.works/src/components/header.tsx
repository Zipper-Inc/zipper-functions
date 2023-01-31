import {
  Box,
  Button,
  ButtonGroup,
  GridItem,
  HStack,
  IconButton,
  Link,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';
import { FiHelpCircle, FiMenu, FiSearch, FiBell } from 'react-icons/fi';

import DefaultGrid from './default-grid';
import { ZipperLogo } from './svg/zipper-logo';
import {
  OrganizationSwitcher,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';
import { useEffect } from 'react';

type HeaderProps = {
  showNav?: boolean;
};

const Header: React.FC<HeaderProps> = ({ showNav = true }) => {
  const router = useRouter();
  const isDesktop = useBreakpointValue({ base: false, lg: true });

  const { reload } = router.query;

  useEffect(() => {
    if (reload) {
      window.location.href = window.location.href.replace('?reload=true', '');
    }
  }, [reload]);

  return (
    <DefaultGrid as="header" paddingY={12}>
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
            <Box fontWeight="bold" fontSize="xl">
              Functions
            </Box>
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
              <NextLink href="/gallery">Gallery</NextLink>
              <Link>Learn</Link>
              <Link>Build</Link>
            </HStack>
          </GridItem>
          <GridItem colSpan={6} as="nav">
            {isDesktop ? (
              <HStack spacing="4" justifyContent="end">
                <ButtonGroup variant="ghost" spacing="1">
                  <IconButton
                    icon={<FiSearch fontSize="1.25rem" />}
                    aria-label="Search"
                  />
                  <IconButton
                    icon={<FiBell fontSize="1.25rem" />}
                    aria-label="Notifications"
                  />
                  <IconButton
                    icon={<FiHelpCircle fontSize="1.25rem" />}
                    aria-label="Help Center"
                  />
                </ButtonGroup>
                <SignedIn>
                  <OrganizationSwitcher
                    afterSwitchOrganizationUrl={`${window.location.pathname}?reload=true`}
                  />
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
