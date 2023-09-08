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
  Text,
  WrapItem,
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
    <Box>
      <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
        <Card
          background="bgColor"
          flexGrow={1}
          overflow="hidden"
          maxW="800px"
          minH="full"
        >
          <CardBody
            padding={0}
            as={HStack}
            alignItems="start"
            justifyContent="stretch"
            p={6}
            spacing={4}
          >
            <Box w={24}>
              <AppAvatar nameOrSlug={nameOrSlug} />
            </Box>
            <VStack alignItems="start" spacing="-0.5" flex={1}>
              <Text as="h2" fontSize="lg" fontWeight="semibold">
                {nameOrSlug}{' '}
              </Text>
              <HStack>
                <Text
                  as={'span'}
                  fontSize="md"
                  fontStyle="italic"
                  fontWeight="light"
                >
                  by
                </Text>{' '}
                <Text as="span" fontSize="md" fontWeight="normal">
                  {app.resourceOwner.slug}
                </Text>
                {app.isPrivate && (
                  <Badge
                    colorScheme="blackAlpha"
                    paddingX={2}
                    color="fg.600"
                    ml="2"
                  >
                    Private
                  </Badge>
                )}
              </HStack>
              <Text
                pt="2"
                fontSize="sm"
                isTruncated
                noOfLines={2}
                whiteSpace="pre-line"
              >
                {app.description}
              </Text>
            </VStack>
          </CardBody>
        </Card>
      </NextLink>
    </Box>
  );
};
