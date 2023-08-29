import {
  Tab,
  ChakraProps,
  UseTabOptions,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import Link from 'next/link';

type TabButtonProps = UseTabOptions &
  ChakraProps & {
    title: string;
    badge?: number;
    href?: string;
  };

export const TabButton: React.FC<TabButtonProps> = ({
  title,
  badge,
  href,
  ...props
}) => {
  const backgroundColor = useColorModeValue('purple.50', 'whiteAlpha.100');
  const textColor = useColorModeValue('purple.700', 'purple.300');
  const inner = (
    <>
      {title}
      {badge && (
        <Badge ml={2} colorScheme="purple">
          {badge}
        </Badge>
      )}
    </>
  );

  return (
    <Tab
      px={4}
      py={2}
      rounded="md"
      _selected={{
        backgroundColor,
        fontWeight: 'bold',
        textColor,
        _hover: { transform: 'none' },
      }}
      _hover={{
        backgroundColor,
        textColor,
        transform: 'scale(1.05)',
      }}
      {...props}
    >
      {href ? (
        <Link shallow href={href}>
          {inner}
        </Link>
      ) : (
        inner
      )}
    </Tab>
  );
};
