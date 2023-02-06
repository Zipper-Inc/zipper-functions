import {
  Menu,
  MenuButton,
  IconButton,
  MenuList,
  MenuItem,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { FiMinimize2, FiMenu } from 'react-icons/fi';

export type NavRoutes = { href: string; text: string };

type MobileMenuProps = { navRoutes: NavRoutes[] };

export const MobileMenu: React.FC<MobileMenuProps> = ({ navRoutes }) => {
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
            </MenuList>
          </>
        );
      }}
    </Menu>
  );
};
