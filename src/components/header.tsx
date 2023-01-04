import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  ButtonGroup,
  GridItem,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  useBreakpointValue,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiHelpCircle, FiMenu, FiSearch, FiBell } from 'react-icons/fi';
import { SessionContextUpdate } from 'supertokens-auth-react/lib/build/recipe/session/types';
import { useSessionContext } from 'supertokens-auth-react/recipe/session';

import DefaultGrid from './default-grid';
import { ZipperLogo } from './svg/zipper-logo';
import { signOut } from 'supertokens-auth-react/recipe/thirdpartyemailpassword';
import { AvatarForCurrentUser } from './avatar';

type HeaderProps = {
  showNav?: boolean;
};

const Header: React.FC<HeaderProps> = ({ showNav = true }) => {
  const router = useRouter();
  const isDesktop = useBreakpointValue({ base: false, lg: true });
  const session = useSessionContext() as SessionContextUpdate & {
    loading: boolean;
  };

  async function onLogout() {
    await signOut();
    router.push('/');
  }

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
              <Link>Gallery</Link>
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
                {session.doesSessionExist && !session.loading ? (
                  <Menu>
                    <MenuButton as={Link}>
                      <HStack>
                        <AvatarForCurrentUser size="sm" />
                        <ChevronDownIcon />
                      </HStack>
                    </MenuButton>
                    <MenuList>
                      <MenuItem onClick={onLogout}>Logout</MenuItem>
                    </MenuList>
                  </Menu>
                ) : (
                  <Button
                    variant={'outline'}
                    colorScheme={'purple'}
                    onClick={() => router.push('/auth')}
                  >
                    Sign in
                  </Button>
                )}
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
