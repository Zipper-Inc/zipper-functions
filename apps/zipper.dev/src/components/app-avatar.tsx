import Avatar from 'boring-avatars';
import {
  PURPLE,
  BLUE,
  ORANGE,
  DARK_PURPLE,
  GRAY,
  DARK_GRAY,
  LIGHT_GRAY,
} from '@zipper/ui';
import { useColorModeValue } from '@chakra-ui/react';

export const defaultAvatarColors = [
  PURPLE,
  DARK_PURPLE,
  ORANGE,
  GRAY,
  DARK_GRAY,
];
export const darkModeAvatarColors = [
  DARK_PURPLE,
  PURPLE,
  ORANGE,
  DARK_GRAY,
  GRAY,
];

function AppAvatar({ nameOrSlug }: { nameOrSlug: string }) {
  const avatarColors = useColorModeValue(
    defaultAvatarColors,
    darkModeAvatarColors,
  );
  return (
    <Avatar
      size="100%"
      square
      name={nameOrSlug}
      variant="bauhaus"
      colors={avatarColors}
    />
  );
}

export default AppAvatar;
