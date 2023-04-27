import Avatar from 'boring-avatars';
import { baseColors } from '@zipper/ui';

const avatarColors = [
  // brand purple 600: #9B2FB4
  baseColors.purple['600'],
  // brand purple 900: #3D1353
  baseColors.purple['900'],
  // orange 500: #F74441
  '#F74441',
  // brand gray warm 200: #E3E2E1
  baseColors.neutral['200'],
  // white: #FFFFFF
  'white',
];

function AppAvatar({ nameOrSlug }: { nameOrSlug: string }) {
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
