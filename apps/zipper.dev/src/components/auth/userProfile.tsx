import { useUser } from '~/hooks/use-user';
import { Text, Box, Stack, Avatar, Divider } from '@chakra-ui/react';
import { SiGithub } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { trpc } from '~/utils/trpc';

export default function UserProfile() {
  const { user, isLoaded } = useUser();
  const { data: accounts } = trpc.useQuery(['user.getAccounts'], {
    enabled: isLoaded,
  });

  return (
    <>
      {user && (
        <Box gap={4} display="flex" flexDirection="column" mb={8}>
          <Stack gap={2}>
            <Text fontSize="md" fontWeight="bold">
              Profile
            </Text>
            <Stack
              flexDirection="row"
              alignItems="center"
              justifyItems="center"
              gap={4}
            >
              <Avatar
                name={user?.name || ''}
                referrerPolicy="no-referrer"
                src={user?.image || ''}
              />
              <Text fontSize="sm" fontWeight="">
                {user.name}
              </Text>
            </Stack>
          </Stack>
          <Stack>
            <Text fontSize="md" fontWeight="bold">
              Email
            </Text>
            <Text fontSize="sm">{user.email}</Text>
          </Stack>
        </Box>
      )}
      <Text fontSize={'xl'} mt="8">
        Connected Accounts
      </Text>
      <Divider mb="4" mt={2} />
      {accounts && accounts.map((account) => (
        <Box key={account.provider} mt="4">
          <Text fontSize="sm" fontWeight="bold">
            {account.provider === 'github' && (
              <Stack direction="row" alignItems="center" gap={2}>
                <SiGithub size={24} color="#181717" />
                <Text>GitHub</Text>
              </Stack>
            )}
            {account.provider === 'google' && (
              <Stack direction="row" alignItems="center" gap={2}>
                <FcGoogle size={24} />
                <Text>Google</Text>
              </Stack>
            )}
          </Text>
        </Box>
      ))}
    </>
  );
}
