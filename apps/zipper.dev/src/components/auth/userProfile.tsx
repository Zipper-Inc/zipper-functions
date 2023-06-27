import { useUser } from '~/hooks/use-user';
import { useEffect, useState } from 'react';
import {
  Text,
  Box,
  Stack,
  Avatar,
  Divider,
  HStack,
  Input,
  Button,
  InputRightElement,
  Icon,
  InputGroup,
} from '@chakra-ui/react';
import { SiGithub } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { trpc } from '~/utils/trpc';
import { HiPencil } from 'react-icons/hi';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { CheckIcon } from '@chakra-ui/icons';

export default function UserProfile() {
  const { user, isLoaded } = useUser();
  const { data: accounts } = trpc.useQuery(['user.getAccounts'], {
    enabled: isLoaded,
  });

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  useEffect(() => {
    if (isLoaded && user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const { slugExists: _slugExists, appSlugQuery } = useAppSlug(username);
  const isSlugValid =
    appSlugQuery.isFetched && username && username.length >= MIN_SLUG_LENGTH;

  const slugExists = username === user?.username ? false : _slugExists;
  const disableSave = slugExists || username === user?.username || username.length < MIN_SLUG_LENGTH;

  const updateUsername = trpc.useMutation('user.updateUserSlug', {
    
    async onSuccess() {
      // need to refresh user

    },
  });
  const handleSaveUsername = async () => {
    if (username.length < MIN_SLUG_LENGTH) {
      return;
    }
    await updateUsername.mutateAsync({ username })
  }
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
          <Stack>
            <Text fontSize="md" fontWeight="bold">
              Username
            </Text>
            <Stack>
              {!isEditingUsername ? (
                <HStack
                  _hover={{ cursor: 'pointer' }}
                  onClick={() => {
                    setIsEditingUsername(true);
                  }}
                >
                  <Text fontSize="sm">{user.username}</Text>
                  <HiPencil />
                </HStack>
              ) : (
                <HStack maxW={200}>
                  <InputGroup>
                    <Input
                      size="sm"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                      }}
                    />

                    {isSlugValid && !updateUsername.isLoading && (
                      <InputRightElement
                        children={
                          slugExists ? (
                            <Icon as={HiExclamationTriangle} color="red.500" />
                          ) : (
                            <CheckIcon color="green.500" />
                          )
                        }
                      />
                    )}
                    
                  </InputGroup>
                  <Button
                    size="sm"
                    variant="link"
                    colorScheme="purple"
                    isDisabled={disableSave}
                    onClick={() => {
                      handleSaveUsername();
                      setIsEditingUsername(false);
                    }}
                  >
                    Save
                  </Button>
                </HStack>
              )}
            </Stack>
          </Stack>
        </Box>
      )}
      <Text fontSize={'xl'} mt="8">
        Connected Accounts
      </Text>
      <Divider mb="4" mt={2} />
      {accounts &&
        accounts.map((account) => (
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
