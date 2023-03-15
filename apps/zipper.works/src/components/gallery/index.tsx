import { Box, GridItem, Heading, Grid, VStack } from '@chakra-ui/react';
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
    <VStack flex={1} px={10} align="stretch">
      <Box overflow="auto" flex={1} py={6}>
        <Grid
          templateColumns="repeat(3, 280px)"
          gridGap={10}
          width="fit-content"
          mx="auto"
        >
          <GridItem colSpan={3}>
            <Heading>{heading}</Heading>
          </GridItem>
          {apps.map((app, index) => {
            return (
              <GalleryItem
                app={app}
                key={app.id}
                size={index === 0 ? 'large' : 'small'}
              />
            );
          })}
        </Grid>
      </Box>
    </VStack>
  );
}
