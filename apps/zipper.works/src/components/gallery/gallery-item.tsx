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
import Avatar from 'boring-avatars';
import { baseColors } from '@zipper/ui';

type GalleryItemProps = {
  app: Unpack<GalleryAppQueryOutput>;
};

const avatarColors = [
  // brand purple 600: #9B2FB4
  baseColors.purple['600'],
  // brand purple 900: #3D1353
  baseColors.purple['900'],
  // orange 500: #F74441
  '#F74441',
  // brand gray warm 200: #E3E2E1
  baseColors.neutral['200'],
  // white: #FFFFFF
  'white',
];

// TODO get the badges from api
const badges: string[] = [];

export const GalleryItem: React.FC<GalleryItemProps> = ({ app }) => {
  const nameOrSlug = app.name || app.slug;

  return (
    <GridItem>
      <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
        <Card background="white" borderRadius={10} height="100%">
          <CardBody
            padding={0}
            as={HStack}
            alignItems="stretch"
            justifyContent="stretch"
            p={6}
            spacing={4}
          >
            <Box w={24}>
              <Avatar
                size="full"
                name={nameOrSlug}
                variant="bauhaus"
                square
                colors={avatarColors}
              />
            </Box>
            <VStack alignItems="start" spacing="1" flex={1}>
              <Heading as="h2" size="md" fontWeight="semibold">
                {nameOrSlug}
              </Heading>
              <Heading as="h3" size="sm" color="gray.800" fontWeight="normal">
                {app.resourceOwner.slug}
              </Heading>
              <VStack alignItems="stretch" pt="2">
                {app.isPrivate && (
                  <HStack paddingY={1}>
                    <Badge
                      colorScheme="blackAlpha"
                      rounded="xl"
                      paddingX={2}
                      color="gray.600"
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
