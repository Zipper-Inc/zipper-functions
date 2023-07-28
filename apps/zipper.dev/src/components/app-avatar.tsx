import Avatar from 'boring-avatars';
import { brandColors, baseColors } from '@zipper/ui';
import { useColorModeValue } from '@chakra-ui/react';

export const defaultAvatarColors = [
  brandColors.brandPurple,
  brandColors.brandDarkPurple,
  brandColors.brandOrange,
  baseColors.neutral['200'],
  'white',
];

export const darkModeAvatarColors = [
  baseColors.purple['200'],
  brandColors.brandPurple,
  brandColors.brandOrange,
  baseColors.neutral['600'],
  baseColors.gray['800'],
];

function AppAvatar({ nameOrSlug }: { nameOrSlug: string }) {
  const avatarColors = useColorModeValue(
    defaultAvatarColors,
    darkModeAvatarColors,
  );
  return (
    <Avatar
      size="100%"
      name={nameOrSlug}
      variant="bauhaus"
      square
      colors={avatarColors}
    />
  );
}

export default AppAvatar;
