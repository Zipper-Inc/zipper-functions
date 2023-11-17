import { useUser } from '~/hooks/use-user';
import { useEffect, useState } from 'react';
import {
  Text,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Box,
  Stack,
  Avatar,
  Divider,
  HStack,
  Input,
  InputRightElement,
  Icon,
  InputGroup,
  VStack,
  Fade,
  Collapse,
} from '@chakra-ui/react';
import { SiGithub } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { trpc } from '~/utils/trpc';
import { HiPencil } from 'react-icons/hi';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { CheckIcon } from '@chakra-ui/icons';

import { UploadDropzone } from '../uploadthing';
import { useSession } from 'next-auth/react';
import { HiArrowRight } from 'react-icons/hi';
import { Account } from '@prisma/client';

type PageType = 'userSettings' | 'profileImage';

export default function UserProfile() {
  const [currentPage, setCurrentPage] = useState<PageType>('userSettings');
  const [showUploadThing, setShowUploadThing] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const { user, isLoaded } = useUser();
  const { data: accounts } = trpc.user.getAccounts.useQuery(undefined, {
    enabled: isLoaded,
  });

  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [username, setUsername] = useState('');
  useEffect(() => {
    if (isLoaded && user?.username) {
      setUsername(user.username);
    }
  }, [user]);

  const isSlugValid = !!username && username.length >= MIN_SLUG_LENGTH;

  const isSlugAvailableQuery = trpc.user.isSlugAvailable.useQuery(
    { slug: username },
    {
      enabled: isSlugValid && isEditingUsername,
    },
  );

  const disableSave =
    username === user?.username ||
    username.length < MIN_SLUG_LENGTH ||
    (isEditingUsername &&
      isSlugAvailableQuery.isSuccess &&
      !isSlugAvailableQuery.data);

  const updateUsername = trpc.user.updateUserSlug.useMutation({
    async onSuccess() {
      session.update({ updateProfile: true });
    },
  });
  const handleSaveUsername = async () => {
    if (username.length < MIN_SLUG_LENGTH) {
      return;
    }
    await updateUsername.mutateAsync({ slug: username });
  };
  const session = useSession();

  return (
    <>
      {user && (
        <Box gap={4} display="flex" flexDirection="column" mb={8}>
          {currentPage === 'profileImage' && (
            <Breadcrumb mb={4}>
              <BreadcrumbItem>
                <Button
                  size="sm"
                  onClick={() => setCurrentPage('userSettings')}
                >
                  Back
                </Button>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink>Profile Image</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          )}
          {currentPage === 'userSettings' && (
            <>
              <Stack gap={2}>
                <Text fontSize="md" fontWeight="bold">
                  Profile
                </Text>
                <Stack
                  flexDirection="row"
                  alignItems="center"
                  alignContent="center"
                  justifyContent="space-between"
                  gap={4}
                  p={4}
                  onClick={() => setCurrentPage('profileImage')}
                  _hover={{
                    cursor: 'pointer',
                    backgroundColor: 'fg.100',
                  }}
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                >
                  <HStack>
                    <Avatar
                      name={user?.name || ''}
                      referrerPolicy="no-referrer"
                      src={user?.image || ''}
                    />
                    <Text fontSize="sm" fontWeight="">
                      {user.name}
                    </Text>
                  </HStack>
                  <Box>
                    <Fade in={isHovered}>
                      <HiArrowRight color="fg.400" />
                    </Fade>
                  </Box>
                </Stack>
              </Stack>
              <Stack p={4}>
                <Text fontSize="md" fontWeight="bold">
                  Email
                </Text>
                <Text fontSize="sm">{user.email}</Text>
              </Stack>
              <Stack p={4}>
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
                              isSlugAvailableQuery.data ||
                              username === user.username ? (
                                <CheckIcon color="green.500" />
                              ) : (
                                <Icon
                                  as={HiExclamationTriangle}
                                  color="red.500"
                                />
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
                          <SiGithub size={24} color="currentColor" />
                          <Text>GitHub</Text>
                        </Stack>
                      )}
                      {account.provider === 'google' && (
                        <Stack direction="row" alignItems="center" gap={2}>
                          <FcGoogle size={24} color="currentColor" />
                          <Text>Google</Text>
                        </Stack>
                      )}
                    </Text>
                  </Box>
                ))}
            </>
          )}
          {currentPage === 'profileImage' && (
            <VStack alignItems="start" w="full">
              <HStack gap={2}>
                <Avatar
                  name={user?.name || ''}
                  referrerPolicy="no-referrer"
                  src={user?.image || ''}
                />
                <VStack alignItems="start">
                  <Text fontWeight="semibold">Profile Image</Text>
                  <Button
                    variant="link"
                    size="sm"
                    colorScheme="purple"
                    onClick={() => setShowUploadThing(!showUploadThing)}
                  >
                    {!showUploadThing ? 'Change Image' : 'Cancel'}
                  </Button>
                </VStack>
              </HStack>
              <Box width="100%">
                <Collapse in={showUploadThing} animateOpacity>
                  <UploadDropzone
                    endpoint="avatarUploader"
                    onClientUploadComplete={() => {
                      session.update({ updateProfile: true });
                      setShowUploadThing(false);
                    }}
                    onUploadError={(e) => {
                      setShowUploadThing(false);
                    }}
                  />
                </Collapse>
              </Box>
            </VStack>
          )}
        </Box>
      )}
    </>
  );
}
