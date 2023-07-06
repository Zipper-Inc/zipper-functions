import { Box, Button, Stack, Text, VStack, useToken } from '@chakra-ui/react';
import { ZipperSymbol } from '@zipper/ui';
import { SessionOrganization } from '~/pages/api/auth/[...nextauth]';

interface EmptySlateProps {
  organization: SessionOrganization | undefined | null;
  onCreateButtonClick: () => void;
}

export function EmptySlate({
  organization,
  onCreateButtonClick,
}: EmptySlateProps) {
  const [gray200] = useToken('colors', ['neutral.200']);

  return (
    <Box bg={'fg50'} w="full" p="4">
      <VStack paddingY={20}>
        <Box bg={'white'} boxShadow="2xl" padding={5} rounded="2xl" mb={6}>
          <ZipperSymbol style={{ maxHeight: '100%' }} fill={gray200} />
        </Box>
        <Stack alignContent="center" gap={2} maxW={500} textAlign="center">
          <Text fontWeight="600" fontSize="2xl">
            Create {organization ? organization.name + "'s" : 'your'} first
            applet
          </Text>
          <Text
            color={'neutral.600'}
            fontSize="sm"
            lineHeight="20px"
            fontWeight="400"
          >
            Write some code to solve a problem or explore an idea. We'll deploy
            your functions, give you a URL, and generate a web UI and API for
            you to use.
          </Text>
        </Stack>
        <Stack>
          <Button
            color={'fg700'}
            bg="white"
            mt={6}
            variant="outline"
            fontWeight="500"
            onClick={onCreateButtonClick}
          >
            Create Applet
          </Button>
        </Stack>
      </VStack>
    </Box>
  );
}
