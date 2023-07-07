import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  useDisclosure,
  ModalOverlay,
  Menu,
  MenuButton,
  MenuList,
  MenuGroup,
  MenuItem,
  Stack,
  Text,
  useColorMode,
  MenuDivider,
} from '@chakra-ui/react';
import UserProfile from './auth/userProfile';
import {
  HiLogout,
  HiOutlineCog,
  HiOutlineMoon,
  HiOutlineSun,
} from 'react-icons/hi';
import { signOut } from 'next-auth/react';
import { AvatarForCurrentUser } from './avatar';

export function UserAvatarMenu() {
  const { colorMode, toggleColorMode } = useColorMode();
  const userSettingsModal = useDisclosure();

  return (
    <>
      <Menu>
        <MenuButton>
          <AvatarForCurrentUser size="sm" />
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
                {colorMode === 'dark' ? <HiOutlineSun /> : <HiOutlineMoon />}
                <Text>
                  Switch to {colorMode === 'dark' ? 'light' : 'dark'} mode
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
