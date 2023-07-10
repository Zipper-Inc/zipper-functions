import {
  Tab,
  ChakraProps,
  UseTabOptions,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';

type TabButtonProps = UseTabOptions &
  ChakraProps & {
    title: string;
    badge?: number;
  };

export const TabButton: React.FC<TabButtonProps> = ({
  title,
  badge,
  ...props
}) => {
  const backgroundColor = useColorModeValue('purple.50', 'whiteAlpha.100');
  const textColor = useColorModeValue('purple.700', 'purple.300');
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
      {title}
      {badge && (
        <Badge ml={2} colorScheme="purple">
          {badge}
        </Badge>
      )}
    </Tab>
  );
};
