import { Button, HStack, Text } from '@chakra-ui/react';
import { ReactElement } from 'react';

export const ProviderButton = ({
  provider,
  primary = false,
  icon,
}: {
  provider: string;
  primary?: boolean;
  icon?: ReactElement;
}) => {
  return (
    <Button
      w={'full'}
      variant={primary ? 'solid' : 'outline'}
      color={primary ? 'bgColor' : 'purple.600'}
      _hover={{ backgroundColor: primary ? 'purple.500' : 'purple.50' }}
      backgroundColor={primary ? 'purple.600' : 'bgColor'}
      borderColor={'purple.600'}
    >
      <HStack gap={4}>
        {icon}
        <Text>{`Continue with ${provider}`}</Text>
      </HStack>
    </Button>
  );
};

export default ProviderButton;
