import NextLink from 'next/link';
import {
  GridItem,
  Card,
  CardBody,
  VStack,
  Stack,
  Heading,
  HStack,
  Badge,
  Box,
} from '@chakra-ui/react';
import { GalleryAppQueryOutput } from '~/pages';
import Avatar from 'boring-avatars';
import { baseColors } from '@zipper/ui';
import { useState } from 'react';

type GalleryItemProps = {
  app: Unpack<GalleryAppQueryOutput>;
  size?: 'small' | 'large';
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

export const GalleryItem: React.FC<GalleryItemProps> = ({
  app,
  size = 'small',
}) => {
  if (size === 'large') {
    return <LargeGalleryItem app={app} />;
  }
  return <SmallGalleryItem app={app} />;
};

const useRandomTranslateX = () => useState(() => Math.random() * 100 - 50)[0];

const SmallGalleryItem: React.FC<Omit<GalleryItemProps, 'size'>> = ({
  app,
}) => {
  const randomTranslateX = useRandomTranslateX();
  const nameOrSlug = app.name || app.slug;

  return (
    <GridItem>
      <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
        <Card
          background="gray.100"
          height="full"
          overflow="hidden"
          borderRadius={10}
        >
          <CardBody
            padding={0}
            as={VStack}
            alignItems="start"
            justifyContent="space-between"
            height="full"
            pb={6}
          >
            <Box
              flex={1}
              overflow="hidden"
              maxH={120}
              w="full"
              transform={`translateX(${randomTranslateX}%)`}
            >
              <Avatar
                size="100%"
                name={nameOrSlug}
                variant="bauhaus"
                colors={avatarColors}
                square
              />
            </Box>
            <Stack spacing="1" width="full" paddingX={4}>
              <Heading as="h3" size="sm" color="gray.800" fontWeight="normal">
                {app.resourceOwner.slug}
              </Heading>
              <Heading as="h2" size="md">
                {nameOrSlug}
              </Heading>
              <VStack alignItems="stretch">
                {badges.length > 0 && (
                  <HStack paddingY={1}>
                    {badges.map((badge) => (
                      <Badge
                        key={badge}
                        colorScheme="blackAlpha"
                        rounded="xl"
                        paddingX={2}
                        color="gray.600"
                      >
                        {badge}
                      </Badge>
                    ))}
                  </HStack>
                )}
              </VStack>
            </Stack>
          </CardBody>
        </Card>
      </NextLink>
    </GridItem>
  );
};

const LargeGalleryItem: React.FC<Omit<GalleryItemProps, 'size'>> = ({
  app,
}) => {
  const randomTranslateX = useRandomTranslateX();
  const nameOrSlug = app.name || app.slug;

  return (
    <GridItem colSpan={3}>
      <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
        <Card
          width="full"
          background="gray.100"
          overflow="hidden"
          borderRadius={10}
        >
          <CardBody
            padding={0}
            as={HStack}
            flexDirection="row-reverse"
            alignItems="stretch"
            justifyContent="stretch"
            height="full"
          >
            <Box
              flex={1}
              height={48}
              transform={`translateX(${randomTranslateX}%)`}
            >
              <Avatar
                size="full"
                name={nameOrSlug}
                variant="bauhaus"
                square
                colors={avatarColors}
              />
            </Box>
            <VStack
              alignItems="stretch"
              justifyContent="end"
              spacing="1"
              paddingX={4}
              flex={1}
              paddingBottom={6}
            >
              <Heading as="h3" size="sm" color="gray.800" fontWeight="normal">
                {app.resourceOwner.slug}
              </Heading>
              <Heading as="h2" size="md">
                {nameOrSlug}
              </Heading>
              <VStack alignItems="stretch">
                {badges.length > 0 && (
                  <HStack paddingY={1}>
                    {badges.map((badge) => (
                      <Badge
                        key={badge}
                        colorScheme="blackAlpha"
                        rounded="xl"
                        paddingX={2}
                        color="gray.600"
                      >
                        {badge}
                      </Badge>
                    ))}
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
