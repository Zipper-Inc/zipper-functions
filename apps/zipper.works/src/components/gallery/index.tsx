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
} from '@chakra-ui/react';
import { useOrganizationList, useUser } from '@clerk/nextjs';
import { ResourceOwnerType } from '@zipper/types';
import { useRouter } from 'next/router';
import React from 'react';
import { HiCog } from 'react-icons/hi';
import { GalleryAppQueryOutput } from '~/pages';
import { GalleryItem } from './gallery-item';

export function Gallery({
  apps,
  heading,
  subheading,
  preheading,
  resourceOwnerId,
  resourceOwnerType,
}: {
  apps: GalleryAppQueryOutput;
  resourceOwnerId?: string;
  resourceOwnerType?: ResourceOwnerType;
  heading?: string;
  subheading?: string;
  preheading?: string;
}) {
  const { user } = useUser();
  const { organizationList, setActive } = useOrganizationList();

  const router = useRouter();

  const showManage =
    (resourceOwnerType === ResourceOwnerType.User &&
      user?.id === resourceOwnerId) ||
    (resourceOwnerType === ResourceOwnerType.Organization &&
      organizationList?.find((o) => o.organization.id === resourceOwnerId));

  return (
    <Center>
      <VStack flex={1} maxW="container.xl" py={6} align="stretch">
        {preheading && <Text color={'gray.500'}>{preheading}</Text>}
        <HStack w="full" pb="6" spacing={4}>
          {heading && <Heading>{heading}</Heading>}
          <Spacer flexGrow={1} />
          {showManage && (
            <Button
              variant="outline"
              size="sm"
              colorScheme="purple"
              p="4"
              onClick={async () => {
                setActive &&
                  (await setActive({
                    organization:
                      resourceOwnerType === ResourceOwnerType.Organization
                        ? resourceOwnerId
                        : null,
                  }));
                router.push('/dashboard');
              }}
            >
              <Icon as={HiCog} mr="2" />
              Manage
            </Button>
          )}
        </HStack>
        {subheading && (
          <Text fontSize={'xl'} pb="6">
            {subheading}
          </Text>
        )}
        <Grid
          templateColumns={[
            'repeat(1, 1fr)',
            'repeat(2, 1fr)',
            'repeat(2, 1fr)',
            'repeat(3, 1fr)',
            'repeat(3, 1fr)',
          ]}
          gridGap={6}
          // bgColor="gray.50"
          rounded={40}
        >
          {apps.map((app) => {
            return <GalleryItem app={app} key={app.id} />;
          })}
        </Grid>
      </VStack>
    </Center>
  );
}
