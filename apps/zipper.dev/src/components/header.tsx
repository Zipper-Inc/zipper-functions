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
  Icon,
  useColorMode,
  MenuDivider,
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
import {
  HiLogout,
  HiOutlineCog,
  HiOutlineMoon,
  HiOutlineSun,
} from 'react-icons/hi';
import { signOut } from 'next-auth/react';
import { HiChevronLeft } from 'react-icons/hi2';

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
  const { user, isLoaded } = useUser();

  const { colorMode, toggleColorMode } = useColorMode();

  const feedbackModal = useDisclosure();
  const userSettingsModal = useDisclosure();

  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const feedbackMutation = trpc.useMutation('user.submitFeedback');

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
          <Box my={3} height={4} color="fgText">
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
                      <HStack spacing={1}>
                        <Icon as={HiChevronLeft} />
                        <Text fontSize="sm">Dashboard</Text>
                      </HStack>
                    </HStack>
                  )}
                </SignedIn>
                <SignedOut>
                  <ZipperLogo style={{ maxHeight: '100%' }} />
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
                    </MenuGroup>
                    <MenuDivider />
                    <MenuGroup title="Settings">
                      <MenuItem onClick={toggleColorMode}>
                        <Stack gap={1} direction="row" alignItems="center">
                          {colorMode === 'dark' ? (
                            <HiOutlineSun />
                          ) : (
                            <HiOutlineMoon />
                          )}
                          <Text>
                            Switch to {colorMode === 'dark' ? 'light' : 'dark'}{' '}
                            mode
                          </Text>
                        </Stack>
                      </MenuItem>
                    </MenuGroup>
                    <MenuDivider />
                    <MenuGroup>
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
