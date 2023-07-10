import NextLink from 'next/link';
import {
  GridItem,
  Card,
  CardBody,
  VStack,
  Heading,
  HStack,
  Badge,
  Box,
} from '@chakra-ui/react';
import { GalleryAppQueryOutput } from '~/pages';
import AppAvatar from '../app-avatar';

type GalleryItemProps = {
  app: Unpack<GalleryAppQueryOutput>;
};

// TODO get the badges from api
const badges: string[] = [];

export const GalleryItem: React.FC<GalleryItemProps> = ({ app }) => {
  if (!app) return <></>;
  const nameOrSlug = app.name || app.slug;

  return (
    <GridItem>
      <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
        <Card background="bgColor" borderRadius={10} height="100%">
          <CardBody
            padding={0}
            as={HStack}
            alignItems="stretch"
            justifyContent="stretch"
            p={6}
            spacing={4}
          >
            <Box w={24}>
              <AppAvatar nameOrSlug={nameOrSlug} />
            </Box>
            <VStack alignItems="start" spacing="1" flex={1}>
              <Heading as="h2" size="md" fontWeight="semibold">
                {nameOrSlug}
              </Heading>
              <Heading as="h3" size="sm" color="fg.800" fontWeight="normal">
                {app.resourceOwner.slug}
              </Heading>
              <VStack alignItems="stretch" pt="2">
                {app.isPrivate && (
                  <HStack paddingY={1}>
                    <Badge
                      colorScheme="blackAlpha"
                      rounded="xl"
                      paddingX={2}
                      color="fg.600"
                    >
                      Private
                    </Badge>
                  </HStack>
                )}
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </NextLink>
    </GridItem>
  );
};
