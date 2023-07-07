import {
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
  Text,
  Stack,
  useDisclosure,
  Modal,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Link,
} from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/router';
import { HiOutlineCog, HiLogout, HiOutlineSpeakerphone } from 'react-icons/hi';
import { IoHelpBuoySharp } from 'react-icons/io5';
import { AvatarForCurrentUser } from '../avatar';
import { FeedbackModal } from './feedback-modal';
import SignedIn from './signed-in';
import SignedOut from './signed-out';
import SignInButton from './signInButton';
import UserProfile from './userProfile';

export function UserProfileButton(props: { showAdditionalOptions?: boolean }) {
  const userSettingsModal = useDisclosure();
  const feedbackModal = useDisclosure();
  return (
    <>
      <SignedIn>
        <Menu>
          <MenuButton>
            <AvatarForCurrentUser size="sm" referrerPolicy="no-referrer" />
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
            {props.showAdditionalOptions && (
              <MenuGroup title="Citizenship">
                <MenuItem onClick={feedbackModal.onOpen}>
                  <Stack gap={1} direction="row" alignItems="center">
                    <HiOutlineSpeakerphone />
                    <Text>Submit Feedback</Text>
                  </Stack>
                </MenuItem>

                <MenuItem
                  as={Link}
                  href="/docs"
                  target="_blank"
                  _hover={{ textDecoration: 'none' }}
                >
                  <Stack gap={1} direction="row" alignItems="center">
                    <IoHelpBuoySharp />
                    <Text>View Docs</Text>
                  </Stack>
                </MenuItem>
              </MenuGroup>
            )}
          </MenuList>
        </Menu>
      </SignedIn>
      <SignedOut>
        <SignInButton />
      </SignedOut>

      <FeedbackModal {...feedbackModal} />

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
  );
}
