import { Box, GridItem, Heading, Grid } from '@chakra-ui/react';
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
    <Box overflowX="auto" flex={1} mx={10} pt={6} height="full">
      <Grid
        templateColumns="repeat(3, 280px)"
        gridGap={10}
        width="fit-content"
        marginX="auto"
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
  );
}
