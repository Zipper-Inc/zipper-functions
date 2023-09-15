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
  MenuDivider,
  useColorMode,
} from '@chakra-ui/react';
import { signOut } from 'next-auth/react';
import {
  PiGearDuotone,
  PiLifebuoyDuotone,
  PiMegaphoneSimpleDuotone,
  PiMoonDuotone,
  PiSignOutDuotone,
  PiSunDuotone,
} from 'react-icons/pi';
import { AvatarForCurrentUser } from '../avatar';
import { FeedbackModal } from './feedback-modal';
import SignedIn from './signed-in';
import SignedOut from './signed-out';
import SignInButton from './signInButton';
import UserProfile from './userProfile';

export function UserProfileButton(props: { showAdditionalOptions?: boolean }) {
  const userSettingsModal = useDisclosure();
  const feedbackModal = useDisclosure();
  const { colorMode, setColorMode } = useColorMode();
  const toggleColorMode = () => {
    const newColor = colorMode === 'dark' ? 'light' : 'dark';
    // also set it so that the docs site follows
    localStorage.setItem('theme', newColor);
    setColorMode(newColor);
  };
  return (
    <>
      <SignedIn>
        <Menu>
          <MenuButton>
            <AvatarForCurrentUser size="sm" referrerPolicy="no-referrer" />
          </MenuButton>
          <MenuList zIndex="popover">
            <MenuGroup title="Settings">
              <MenuItem onClick={userSettingsModal.onOpen}>
                <Stack gap={1} direction="row" alignItems="center">
                  <PiGearDuotone />
                  <Text>Manage profile</Text>
                </Stack>
              </MenuItem>
              <MenuItem onClick={toggleColorMode}>
                <Stack gap={1} direction="row" alignItems="center">
                  {colorMode === 'dark' ? (
                    <PiSunDuotone color="DarkGoldenRod" />
                  ) : (
                    <PiMoonDuotone color="DarkGoldenRod" />
                  )}
                  <Text>
                    Switch to {colorMode === 'dark' ? 'light' : 'dark'} mode
                  </Text>
                </Stack>
              </MenuItem>
            </MenuGroup>
            {props.showAdditionalOptions && (
              <MenuGroup title="Citizenship">
                <MenuItem onClick={feedbackModal.onOpen}>
                  <Stack gap={1} direction="row" alignItems="center">
                    <PiMegaphoneSimpleDuotone />
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
                    <PiLifebuoyDuotone />
                    <Text>View Docs</Text>
                  </Stack>
                </MenuItem>
              </MenuGroup>
            )}
            <MenuDivider />
            <MenuGroup>
              <MenuItem onClick={() => signOut()}>
                <Stack gap={1} direction="row" alignItems="center">
                  <PiSignOutDuotone />
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
