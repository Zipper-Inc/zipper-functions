import { Box, Button, Stack, Text, VStack, useToken } from '@chakra-ui/react';
import { ZipperSymbol } from '../svg/zipperSymbol';
import type { OrganizationResource } from '@clerk/types';

interface EmptySlateProps {
  organization: OrganizationResource | undefined | null;
  onCreateButtonClick: () => void;
}

export function EmptySlate({
  organization,
  onCreateButtonClick,
}: EmptySlateProps) {
  const [gray200] = useToken('colors', ['neutral.200']);

  return (
    <Box bg={'neutral.50'} rounded="40px" w="full" p="4">
      <VStack paddingY={20}>
        <Box bg={'white'} boxShadow="2xl" padding={5} rounded="2xl" mb={6}>
          <ZipperSymbol style={{ maxHeight: '100%' }} fill={gray200} />
        </Box>
        <Stack alignContent="center" gap={2} maxW={500} textAlign="center">
          <Text fontWeight="600" fontSize="2xl">
            Create {organization ? organization.name : 'your'} first app to get
            started
          </Text>
          <Text
            color={'neutral.600'}
            fontSize="sm"
            lineHeight="20px"
            fontWeight="400"
          >
            Use apps to connect your API and create a platform. By connecting
            your app to an API, you can access a wealth of information and
            functionality that would otherwise be unavailable to your app. With
            this data, you can create a platform that provides unique value to
            your users.
          </Text>
        </Stack>
        <Stack>
          <Button
            color={'gray.700'}
            bg="white"
            mt={6}
            variant="outline"
            fontWeight="500"
            onClick={onCreateButtonClick}
          >
            Create an app
          </Button>
        </Stack>
      </VStack>
    </Box>
  );
}
