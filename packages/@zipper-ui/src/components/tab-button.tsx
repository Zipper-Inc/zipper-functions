import { Tab, ChakraProps, UseTabOptions } from '@chakra-ui/react';

type TabButtonProps = UseTabOptions &
  ChakraProps & {
    title: string;
  };

export const TabButton: React.FC<TabButtonProps> = ({ title, ...props }) => {
  return (
    <Tab
      px={6}
      py={3}
      rounded="md"
      _selected={{
        backgroundColor: 'purple.50',
        fontWeight: 'bold',
        textColor: 'purple.700',
        _hover: { transform: 'none' },
      }}
      _hover={{
        backgroundColor: 'purple.50',
        textColor: 'purple.700',
        transform: 'scale(1.05)',
      }}
      {...props}
    >
      {title}
    </Tab>
  );
};
