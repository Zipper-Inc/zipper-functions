import {
  Tab,
  ChakraProps,
  UseTabOptions,
  Badge,
  useColorModeValue,
  useColorMode,
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
  return (
    <Tab
      px={6}
      py={3}
      rounded="md"
      _selected={{
        backgroundColor: 'highlightSurface',
        fontWeight: 'bold',
        textColor: 'highlightText',
        _hover: { transform: 'none' },
      }}
      _hover={{
        backgroundColor: 'highlightSurface',
        textColor: 'highlightText',
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
