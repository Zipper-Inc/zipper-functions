import { useEffect, useState } from 'react';
import {
  Box,
  HStack,
  Link,
  Flex,
  useBreakpointValue,
  Divider,
  Button,
  Modal,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  useDisclosure,
  FormControl,
  FormLabel,
  ModalOverlay,
  Textarea,
  Spinner,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
  Stack,
  Text,
  useColorMode,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import NextLink from 'next/link';

import { ZipperLogo } from '@zipper/ui';
import OrganizationSwitcher from './auth/organizationSwitcher';
import { MobileMenu } from './header-mobile-menu';
import { ZipperSymbol } from '@zipper/ui';
import SignInButton from './auth/signInButton';
import { trpc } from '~/utils/trpc';
import { useUser } from '~/hooks/use-user';
import SignedIn from './auth/signed-in';
import SignedOut from './auth/signed-out';
import UserProfile from './auth/userProfile';
import { HiLogout, HiOutlineCog } from 'react-icons/hi';
import { signOut } from 'next-auth/react';

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

const Header: React.FC<HeaderProps> = ({
  showNav = true,
  showDivider = true,
  showOrgSwitcher,
}) => {
  const router = useRouter();
  const isTablet = useBreakpointValue({ base: false, md: true });
  const baseRoute = router.pathname.split('/')[1];

  const { reload } = router.query;
  const { user } = useUser();

  const feedbackModal = useDisclosure();
  const userSettingsModal = useDisclosure();

  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const feedbackMutation = trpc.useMutation('user.submitFeedback');
  const { colorMode, toggleColorMode } = useColorMode();

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
                {showNav && showOrgSwitcher ? (
                  <ZipperSymbol
                    style={{ maxHeight: '100%' }}
                    fill="var(--chakra-colors-primaryText)"
                  />
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
                  <HStack>
                    <OrganizationSwitcher
                      border="none"
                      variant="unstyled"
                      fontSize="xl"
                      overflow="auto"
                      whiteSpace="nowrap"
                      fontWeight="medium"
                      color="gray.600"
                    />
                  </HStack>
                </SignedIn>
              </Box>
            </>
          )}
        </HStack>
        <Button onClick={toggleColorMode}>
          Toggle {colorMode === 'light' ? 'Dark' : 'Light'}
        </Button>

        {showNav && (
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
                color={user ? 'gray.600' : 'purple'}
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
                      color="tertiaryText"
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
                    color="tertiary"
                    onClick={feedbackModal.onOpen}
                  >
                    Feedback
                  </Button>

                  <Modal
                    isOpen={feedbackModal.isOpen}
                    onClose={() => {
                      setSubmittingFeedback(false);
                      feedbackModal.onClose();
                    }}
                    size="xl"
                  >
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>What's going on?</ModalHeader>
                      <ModalCloseButton />
                      <ModalBody>
                        <FormControl>
                          <FormLabel>Share your feedback</FormLabel>
                          <Textarea
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                        </FormControl>
                      </ModalBody>
                      <ModalFooter>
                        <Button
                          colorScheme="purple"
                          isDisabled={submittingFeedback}
                          onClick={async () => {
                            setSubmittingFeedback(true);
                            await feedbackMutation.mutateAsync({
                              feedback,
                              url: window.location.href,
                            });
                            setSubmittingFeedback(false);
                            feedbackModal.onClose();
                          }}
                        >
                          {submittingFeedback ? <Spinner /> : 'Submit'}
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>

                  <Modal
                    isOpen={userSettingsModal.isOpen}
                    onClose={() => {
                      userSettingsModal.onClose();
                    }}
                    size="xl"
                  >
                    <ModalOverlay />
                    <ModalContent>
                      <ModalHeader>User Settings</ModalHeader>
                      <ModalCloseButton />
                      <Stack p={8}>
                        <UserProfile />
                      </Stack>
                    </ModalContent>
                  </Modal>
                </>
              )}
              <SignedIn>
                <Menu>
                  <MenuButton>
                    <Avatar
                      name={user?.name || ''}
                      referrerPolicy="no-referrer"
                      src={user?.image || ''}
                      size="sm"
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuGroup title="Profile">
                      <MenuItem onClick={userSettingsModal.onOpen}>
                        <Stack gap={1} direction="row" alignItems="center">
                          <HiOutlineCog />
                          <Text>Manage account</Text>
                        </Stack>
                      </MenuItem>
                      <MenuItem onClick={() => signOut()}>
                        <Stack gap={1} direction="row" alignItems="center">
                          <HiLogout />
                          <Text>Sign out</Text>
                        </Stack>
                      </MenuItem>
                    </MenuGroup>
                  </MenuList>
                </Menu>
              </SignedIn>
              <SignedOut>
                <SignInButton />
              </SignedOut>
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
