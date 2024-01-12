'use client';
import { Dropdown, Button, Avatar, Show } from '@zipper/ui';
import React, { ReactNode, useCallback } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { SignedIn, SignedOut } from './user-status';
import UserProfile from '../../auth/userProfile';
import { useUser } from '~/hooks/use-user';
import { useTheme } from 'next-themes';
import { FeedbackModal as FeedbackDialog } from '../../auth/feedback-modal';
import Link from 'next/link';
import {
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  useColorMode,
} from '@chakra-ui/react';
import {
  PiGearDuotone,
  PiMoonDuotone,
  PiSunDuotone,
  PiMegaphoneSimpleDuotone,
  PiLifebuoyDuotone,
  PiSignOutDuotone,
} from 'react-icons/pi';

const SettingsDialog: React.FC<ReturnType<typeof useDisclosure>> = (
  settingsModal,
) => {
  return (
    <Modal
      isOpen={settingsModal.isOpen}
      onClose={() => settingsModal.onClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>User Settings</ModalHeader>
        <ModalCloseButton />
        <main className="flex flex-col gap-8 px-6">
          <UserProfile />
        </main>
      </ModalContent>
    </Modal>
  );
};

const ProfileAvatar: React.FC = () => {
  const { user } = useUser();

  return (
    <Avatar>
      <Avatar.Image src={user?.image as string} alt={user?.name as string} />
      <Avatar.Fallback>{user?.name?.charAt(0)}</Avatar.Fallback>
    </Avatar>
  );
};

const ProfileMenu = ({
  trigger,
  showExtraOptions,
}: {
  trigger: ReactNode;
  showExtraOptions?: boolean;
}) => {
  const { setColorMode: setChakraColorMode } = useColorMode();
  const { setTheme, theme } = useTheme();

  const feedbackDialog = useDisclosure();
  const settingsDialog = useDisclosure();

  const toggleColorMode = useCallback(() => {
    const color = theme === 'dark' ? 'light' : 'dark';
    /** TO-DO: remove it when chakra's gone. */
    return setTheme(color), setChakraColorMode(color);
  }, [setChakraColorMode, setTheme, theme]);

  return (
    <React.Fragment>
      <Dropdown.Root>
        <Dropdown.Trigger>{trigger}</Dropdown.Trigger>
        <Dropdown.Content align="end">
          <Dropdown.Label>Settings</Dropdown.Label>
          <Dropdown.Separator />
          <Dropdown.Item
            onClick={settingsDialog.onOpen}
            className="flex items-center gap-3 cursor-pointer"
          >
            <PiGearDuotone />
            Manage profile
          </Dropdown.Item>
          <Dropdown.Item
            onClick={toggleColorMode}
            className="flex items-center gap-3 cursor-pointer"
          >
            <Show
              when={theme === 'dark'}
              fallback={<PiMoonDuotone color="DarkGoldenRod" />}
            >
              <PiSunDuotone color="DarkGoldenRod" />
            </Show>
            Switch to {theme === 'dark' ? 'light' : 'dark'} mode
          </Dropdown.Item>

          <Show when={showExtraOptions === true}>
            <Dropdown.Item
              onClick={feedbackDialog.onOpen}
              className="flex items-center gap-3 cursor-pointer"
            >
              <PiMegaphoneSimpleDuotone />
              Submit Feedback
            </Dropdown.Item>
            <Dropdown.Item
              asChild
              className="flex items-center gap-3 cursor-pointer"
            >
              <Link href="/docs">
                <React.Fragment>
                  <PiLifebuoyDuotone />
                  View Docs
                </React.Fragment>
              </Link>
            </Dropdown.Item>
          </Show>

          <Dropdown.Separator />
          <Dropdown.Item
            onClick={() => signOut()}
            className="flex items-center gap-3 cursor-pointer"
          >
            <PiSignOutDuotone className="text-brand-red" />
            Sign out
          </Dropdown.Item>
        </Dropdown.Content>
      </Dropdown.Root>

      {/** TO-DO: refactor to shadcn dialgos */}
      <FeedbackDialog {...feedbackDialog} />
      <SettingsDialog {...settingsDialog} />
    </React.Fragment>
  );
};

interface ProfileButtonOptions {
  showExtraOptions?: boolean;
}

export const ProfileButton: React.FC<ProfileButtonOptions> = ({
  showExtraOptions = false,
}) => {
  return (
    <React.Fragment>
      <SignedIn>
        <ProfileMenu
          trigger={<ProfileAvatar />}
          showExtraOptions={showExtraOptions}
        />
      </SignedIn>
      <SignedOut>
        <Button onClick={() => signIn}>Sign In</Button>
      </SignedOut>
    </React.Fragment>
  );
};
