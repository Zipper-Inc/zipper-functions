import {
  Heading,
  Grid,
  VStack,
  Center,
  Text,
  HStack,
  Button,
  Spacer,
  Icon,
  useDisclosure,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalOverlay,
  Box,
  Stack,
  useToken,
} from '@chakra-ui/react';
import { ResourceOwnerSlug } from '@prisma/client';
import { ResourceOwnerType } from '@zipper/types';
import { ZipperSymbol } from '@zipper/ui';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { HiCog, HiPlus } from 'react-icons/hi';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { useUser } from '~/hooks/use-user';
import { GalleryAppQueryOutput } from '~/pages';
import { trpc } from '~/utils/trpc';
import { CreateAppForm } from '../dashboard/create-app-form';
import { GalleryItem } from './gallery-item';

export function Gallery({
  apps,
  heading,
  subheading,
  preheading,
}: {
  apps: GalleryAppQueryOutput;
  heading?: string;
  subheading?: string;
  preheading?: string;
}) {
  const { user } = useUser();
  const session = useSession();
  const { organizationList, setActive } = useOrganizationList();
  const [isNavigating, setIsNavigating] = useState(false);
  const { isOpen, onClose, onOpen } = useDisclosure();
  const [resourceOwner, setResourceOwner] = useState<
    ResourceOwnerSlug | undefined
  >();

  const resourceOwnerNameQuery = trpc.useQuery(
    ['resourceOwnerSlug.getName', { slug: resourceOwner?.slug as string }],
    {
      enabled: !!resourceOwner?.slug,
    },
  );

  const acceptInvitation = trpc.useMutation('organization.acceptInvitation');

  const showManage =
    (resourceOwner?.resourceOwnerType === ResourceOwnerType.User &&
      user?.id === resourceOwner?.resourceOwnerId) ||
    (resourceOwner?.resourceOwnerType === ResourceOwnerType.Organization &&
      organizationList?.find(
        (o) => o.organization.id === resourceOwner?.resourceOwnerId,
      ));

  useEffect(() => {
    if (!heading) setResourceOwner(apps?.[0]?.resourceOwner);
  }, [heading, apps]);

  const [gray200] = useToken('colors', ['neutral.200']);

  if (!apps?.length) {
    return (
      <Center>
        <VStack paddingY={20} bg={'gray.50'} w="90%">
          <Box bg={'white'} boxShadow="2xl" padding={5} rounded="2xl" mb={6}>
            <ZipperSymbol style={{ maxHeight: '100%' }} fill={gray200} />
          </Box>
          <Stack alignContent="center" gap={2} maxW={500} textAlign="center">
            <Text fontWeight="600" fontSize="2xl">
              There's nothing to see here yet
            </Text>
            <Text
              color={'neutral.600'}
              fontSize="sm"
              lineHeight="20px"
              fontWeight="400"
            >
              As users and organizations create public apps, they automatically
              appear on their profile pages.
            </Text>
          </Stack>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      <Center>
        <VStack flex={1} maxW="container.xl" py={6} align="stretch">
          {preheading && <Text color={'fg.500'}>{preheading}</Text>}
          <HStack w="full" pb="6" spacing={4}>
            <Heading>
              {heading || resourceOwnerNameQuery.data || resourceOwner?.slug}
            </Heading>
            {session.data?.organizationMemberships?.find((org) => {
              return org.organization.id === resourceOwner?.resourceOwnerId;
            })?.pending && (
              <Button
                colorScheme="purple"
                onClick={async () => {
                  if (resourceOwner) {
                    await acceptInvitation.mutateAsync({
                      organizationId: resourceOwner.resourceOwnerId!,
                    });
                    session.update({
                      updateOrganizationList: true,
                      setCurrentOrganizationId: resourceOwner.resourceOwnerId!,
                    });
                  }
                }}
              >
                Accept Invitation
              </Button>
            )}
            <Spacer flexGrow={1} />
            {showManage && setActive && (
              <>
                <Modal isOpen={isOpen} onClose={onClose} size="xl">
                  <ModalOverlay />
                  <ModalContent maxH="2xl">
                    <ModalCloseButton />
                    <ModalBody>
                      <CreateAppForm onClose={onClose} />
                    </ModalBody>
                  </ModalContent>
                </Modal>
                <HStack>
                  <Button
                    size="sm"
                    colorScheme="purple"
                    isDisabled={isNavigating}
                    p="4"
                    onClick={async () => {
                      await setActive(
                        resourceOwner?.resourceOwnerType ===
                          ResourceOwnerType.Organization
                          ? resourceOwner?.resourceOwnerId
                          : null,
                      );
                      onOpen();
                    }}
                  >
                    <Icon as={HiPlus} mr="2" />
                    Create Applet
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    colorScheme="purple"
                    isDisabled={isNavigating}
                    p="4"
                    onClick={async () => {
                      setIsNavigating(true);
                      await setActive(
                        resourceOwner?.resourceOwnerType ===
                          ResourceOwnerType.Organization
                          ? resourceOwner?.resourceOwnerId
                          : null,
                      );
                      setIsNavigating(false);
                      window.location.replace('../dashboard');
                    }}
                  >
                    <Icon as={HiCog} mr="2" />
                    Manage
                  </Button>
                </HStack>
              </>
            )}
          </HStack>
          <Text fontSize={'xl'} pb="6">
            {resourceOwner?.slug || subheading}
          </Text>
          <Grid
            templateColumns={[
              'repeat(1, 1fr)',
              'repeat(2, 1fr)',
              'repeat(2, 1fr)',
              'repeat(3, 1fr)',
              'repeat(3, 1fr)',
            ]}
            gridGap={6}
            // bgColor="fg.50"
            rounded={40}
          >
            {(apps || []).map((app) => {
              return <GalleryItem app={app} key={app.id} />;
            })}
          </Grid>
        </VStack>
      </Center>
    </>
  );
}
