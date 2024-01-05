'use client';
import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
  UseDisclosureReturn,
} from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import { FiMinimize2, FiMenu } from 'react-icons/fi';
import { FeedbackModal } from './auth/feedback-modal';

export type NavRoutes = { href: string; text: string };

type MobileMenuProps = {
  navRoutes: NavRoutes[];
  feedbackModal: UseDisclosureReturn | null;
};

export const MobileMenu: React.FC<MobileMenuProps> = ({
  navRoutes,
  feedbackModal,
}) => {
  const router = useRouter();
  return (
    <Menu>
      {({ isOpen }) => {
        const icon = isOpen ? (
          <FiMinimize2 fontSize="1.25rem" />
        ) : (
          <FiMenu fontSize="1.25rem" />
        );

        return (
          <>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={icon}
              variant="outline"
            />
            <MenuList>
              {navRoutes.map((r) => {
                return (
                  <MenuItem key={r.text} onClick={() => router.push(r.href)}>
                    {r.text}
                  </MenuItem>
                );
              })}
              {feedbackModal && (
                <MenuItem onClick={feedbackModal.onOpen}>Feedback</MenuItem>
              )}
            </MenuList>
            {feedbackModal && <FeedbackModal {...feedbackModal} />}
          </>
        );
      }}
    </Menu>
  );
};
