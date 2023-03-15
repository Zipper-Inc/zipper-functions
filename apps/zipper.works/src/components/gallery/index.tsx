import { Heading, Grid, VStack } from '@chakra-ui/react';
import React from 'react';
import { GalleryAppQueryOutput } from '~/pages';
import { GalleryItem } from './gallery-item';

export function Gallery({
  apps,
  heading,
}: {
  apps: GalleryAppQueryOutput;
  heading?: string;
}) {
  return (
    <VStack flex={1} px={10} py={6} align="stretch" spacing="12">
      <Heading>{heading}</Heading>
      <Grid
        templateColumns={[
          'repeat(1, 1fr)',
          'repeat(2, 1fr)',
          'repeat(2, 1fr)',
          'repeat(3, 1fr)',
          'repeat(3, 1fr)',
          'repeat(4, 1fr)',
        ]}
        gridGap={6}
        bgColor="gray.50"
        rounded={40}
        p={6}
      >
        {apps.map((app) => {
          return <GalleryItem app={app} key={app.id} />;
        })}
      </Grid>
    </VStack>
  );
}
