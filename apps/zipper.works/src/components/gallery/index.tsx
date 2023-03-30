import { Heading, Grid, VStack, Center, Text } from '@chakra-ui/react';
import React from 'react';
import { GalleryAppQueryOutput } from '~/pages';
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
  return (
    <Center>
      <VStack flex={1} maxW="container.xl" py={6} align="stretch">
        {preheading && <Text color={'gray.500'}>{preheading}</Text>}
        {heading && <Heading pb="6">{heading}</Heading>}
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
