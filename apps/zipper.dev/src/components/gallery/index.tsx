import {
  Heading,
  VStack,
  Center,
  Text,
  HStack,
  Button,
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
  SimpleGrid,
  Input,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
} from '@chakra-ui/react';
import { ResourceOwnerSlug } from '@prisma/client';
import { ResourceOwnerType } from '@zipper/types';
import { ZipperSymbol } from '@zipper/ui';
import { useSession } from 'next-auth/react';
import React, { useEffect, useState } from 'react';
import { HiPlus } from 'react-icons/hi';
import { HiCheck } from 'react-icons/hi2';
import { useOrganizationList } from '~/hooks/use-organization-list';
import { useUser } from '~/hooks/use-user';
import { trpc } from '~/utils/trpc';
import { CreateAppForm } from '../dashboard/create-app-form';
import { TITLE_COLUMN_MIN_WIDTH } from '../playground/constants';
import { GalleryAppQueryOutput, GalleryItem } from './gallery-item';

export function Gallery({
  apps,
  heading,
  subheading,
  isPublicGallery = false,
}: {
  apps: GalleryAppQueryOutput;
  heading?: string;
  subheading?: string;
  preheading?: string;
  isPublicGallery?: boolean;
}) {
  const { user } = useUser();
  const session = useSession();
  const { organizationList, setActive } = useOrganizationList();
  const [isNavigating, setIsNavigating] = useState(false);
  const [appSearchTerm, setAppSearchTerm] = useState<string | undefined>();
  const createAppModal = useDisclosure();
  const [resourceOwner, setResourceOwner] = useState<
    ResourceOwnerSlug | undefined
  >();

  const acceptInvitation = trpc.organization.acceptInvitation.useMutation();

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

  const [gray200] = useToken('colors', ['fg.200']);

  if (!apps?.length) {
    return (
      <Center>
        <VStack paddingY={20} bg={'gray.50'} w="90%">
          <Box bg={'white'} boxShadow="2xl" padding={5} mb={6}>
            <ZipperSymbol style={{ maxHeight: '100%' }} fill={gray200} />
          </Box>
          <Stack alignContent="center" gap={2} maxW={500} textAlign="center">
            <Text fontWeight="600" fontSize="2xl">
              There's nothing to see here yet
            </Text>
            <Text
              color={'fg.600'}
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
    <VStack px={10} alignItems="start" gap={8}>
      <VStack
        borderBottomWidth="1px"
        borderColor="fg.200"
        w="full"
        alignItems="start"
      >
        <Heading as="h3" pb="4" fontWeight={400}>
          {heading || resourceOwner?.slug}
        </Heading>
      </VStack>
      <HStack
        spacing={0}
        flex={1}
        alignItems="start"
        gap={16}
        w="full"
        flexDirection={{ base: 'column', sm: 'row' }}
      >
        <VStack flex={1} alignItems="stretch" minW={TITLE_COLUMN_MIN_WIDTH}>
          <Text color="fg.600" pb="4" whiteSpace="pre-line">
            {subheading || resourceOwner?.slug}
          </Text>
          {session.data?.organizationMemberships?.find((org) => {
            return org.organization.id === resourceOwner?.resourceOwnerId;
          })?.pending && (
            <Button
              colorScheme="purple"
              size="sm"
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
              <Icon as={HiCheck} mx="2" />
              Accept Invitation
            </Button>
          )}
          {isPublicGallery && (
            <Accordion pt="10" allowMultiple>
              <AccordionItem>
                <AccordionButton>
                  <Box
                    fontWeight="semibold"
                    as="span"
                    flex="1"
                    textAlign="left"
                  >
                    What are Applets?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  Applets are web-services that have been built and deployed on
                  Zipper. Applets can be forked and customized to your needs.
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box
                    fontWeight="semibold"
                    as="span"
                    flex="1"
                    textAlign="left"
                  >
                    What is Zipper?
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  Zipper is a platform for building web services using simple
                  Typescript functions. We take care of UI, APIs, and auth for
                  you.
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          )}
        </VStack>
        <VStack align="stretch" flex={3} pb="10">
          {showManage && setActive && (
            <>
              <Modal
                isOpen={createAppModal.isOpen}
                onClose={createAppModal.onClose}
                size="4xl"
              >
                <ModalOverlay />
                <ModalContent h="2xl">
                  <ModalCloseButton />
                  <ModalBody>
                    <Center mt="6">
                      <CreateAppForm onClose={createAppModal.onClose} />
                    </Center>
                  </ModalBody>
                </ModalContent>
              </Modal>

              <HStack w="full" spacing={4} pb="4">
                <Input
                  placeholder="Search applets (name, slug or description)"
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                />
                <Button
                  size="sm"
                  colorScheme="purple"
                  ml="auto"
                  isDisabled={isNavigating}
                  p="5"
                  onClick={async () => {
                    await setActive(
                      resourceOwner?.resourceOwnerType ===
                        ResourceOwnerType.Organization
                        ? resourceOwner?.resourceOwnerId
                        : null,
                    );
                    createAppModal.onOpen();
                  }}
                >
                  <Icon as={HiPlus} mr="2" />
                  Create Applet
                </Button>
              </HStack>
            </>
          )}
          <SimpleGrid minChildWidth={{ sm: '500px' }} gridGap={6}>
            {(apps || [])
              .filter((app) => {
                if (!appSearchTerm) return true;
                return (
                  app.name?.includes(appSearchTerm) ||
                  app.slug.includes(appSearchTerm) ||
                  app.description?.includes(appSearchTerm)
                );
              })
              .map((app) => {
                return <GalleryItem app={app} key={app.id} />;
              })}
          </SimpleGrid>
        </VStack>
      </HStack>
    </VStack>
  );
}
