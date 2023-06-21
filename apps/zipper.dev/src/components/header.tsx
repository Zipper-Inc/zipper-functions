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
  const { isOpen, onOpen, onClose } = useDisclosure();
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
          <Box my={3} height={4}>
            <NextLink href="/">
              <SignedIn>
                {showNav && showOrgSwitcher ? (
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
                    color="gray.600"
                    onClick={onOpen}
                  >
                    Feedback
                  </Button>

                  <Modal
                    isOpen={isOpen}
                    onClose={() => {
                      setSubmittingFeedback(false);
                      onClose();
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
                            onClose();
                          }}
                        >
                          {submittingFeedback ? <Spinner /> : 'Submit'}
                        </Button>
                      </ModalFooter>
                    </ModalContent>
                  </Modal>
                </>
              )}
              <SignedIn>
                {user?.username}
                <Link href="/api/auth/signout">Sign out</Link>
                {/* <UserButton afterSignOutUrl="/" /> */}
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
