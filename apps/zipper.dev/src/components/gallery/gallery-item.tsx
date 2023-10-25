import Link from 'next/link';
import {
  Card,
  CardBody,
  VStack,
  HStack,
  Badge,
  Box,
  Text,
  Button,
} from '@chakra-ui/react';
import AppAvatar from '../app-avatar';
import { RouterOutputs } from '~/utils/trpc';
import { useState } from 'react';

type GalleryItemProps = {
  app: Unpack<GalleryAppQueryOutput>;
};

export type GalleryAppQueryOutput =
  | RouterOutputs['app']['allApproved']
  | RouterOutputs['app']['byResourceOwner'];

const InnerCard: React.FC<GalleryItemProps> = ({ app }) => {
  const nameOrSlug = app.name || app.slug;
  const [isHovering, setIsHovering] = useState(false);
  return (
    <CardBody
      padding={0}
      as={HStack}
      alignItems="start"
      justifyContent="stretch"
      p={6}
      spacing={4}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <Box w={24}>
        <AppAvatar nameOrSlug={nameOrSlug} />
      </Box>
      <VStack alignItems="start" spacing={8} flex={1}>
        <VStack alignItems="start" spacing="-0.5" flex={1}>
          <Text as="h2" fontSize="lg" fontWeight="semibold">
            {nameOrSlug}{' '}
          </Text>
          <HStack>
            <Text as="span" fontSize="md" fontStyle="italic" fontWeight="light">
              by
            </Text>
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
          {isHovering ? (
            <HStack spacing={2} pt="3">
              <Button variant="outline" colorScheme="purple" size="sm">
                <Link href={`/${app.resourceOwner.slug}/${app.slug}`}>
                  Open Applet
                </Link>
              </Button>
              <Button variant="link" colorScheme="purple" size="sm">
                <Link href={`/gallery/${app.resourceOwner.slug}/${app.slug}`}>
                  Learn more
                </Link>
              </Button>
            </HStack>
          ) : (
            <Text
              pt="2"
              color="fg.500"
              fontSize="sm"
              isTruncated
              noOfLines={2}
              whiteSpace="pre-line"
            >
              {app.description}
            </Text>
          )}
        </VStack>
      </VStack>
    </CardBody>
  );
};

export const GalleryItem: React.FC<GalleryItemProps> = ({ app }) => {
  if (!app) return <></>;

  return (
    <Box>
      <Card
        as={Link}
        background="bgColor"
        flexGrow={1}
        overflow="hidden"
        maxW="800px"
        minH="full"
        boxShadow="none"
        borderWidth="1px"
        borderColor="fg.200"
        href={`/gallery/${app.resourceOwner.slug}/${app.slug}`}
      >
        <InnerCard app={app}></InnerCard>
      </Card>
    </Box>
  );
};
