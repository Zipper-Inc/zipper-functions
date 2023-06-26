import { useUser } from '~/hooks/use-user';
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
  VStack,
  Fade,
  Collapse,
  Slide,
} from '@chakra-ui/react';
import { SiGithub } from 'react-icons/si';
import { FcGoogle } from 'react-icons/fc';
import { trpc } from '~/utils/trpc';
import { useState } from 'react';
import { UploadDropzone } from '../uploadthing';
import { useSession } from 'next-auth/react';
import { HiArrowRight } from 'react-icons/hi';

type PageType = 'userSettings' | 'profileImage';

export default function UserProfile() {
  const [currentPage, setCurrentPage] = useState<PageType>('userSettings');
  const [showUploadThing, setShowUploadThing] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const { user, isLoaded } = useUser();
  const { data: accounts } = trpc.useQuery(['user.getAccounts'], {
    enabled: isLoaded,
  });

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
                    backgroundColor: 'gray.100',
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
                      <HiArrowRight color="gray.400" />
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
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      session.update({ updateProfile: true });
                      setShowUploadThing(false);
                    }}
                    onUploadError={(err) => {
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
