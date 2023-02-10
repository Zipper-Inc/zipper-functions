import NextLink from 'next/link';
import {
  Grid as InnerGrid,
  GridItem,
  Heading,
  HStack,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import DefaultGrid from '~/components/default-grid';
import { HiSparkles } from 'react-icons/hi';
import { SignedIn } from '@clerk/nextjs';
import { GalleryAppQueryOutput } from '~/pages';

export function Gallery({ apps }: { apps: GalleryAppQueryOutput }) {
  return (
    <DefaultGrid mt={14}>
      <GridItem colSpan={3}>
        <VStack alignItems="start" spacing={2} w={280}>
          <SignedIn>
            <HStack>
              <HiSparkles />
              <NextLink href="/dashboard">
                <Text fontWeight={600}>My Apps</Text>
              </NextLink>
            </HStack>
          </SignedIn>
          <Link href="#">Popular Apps</Link>
          <Link href="#">AI Magic</Link>
          <Link href="#">Note Taking</Link>
        </VStack>
      </GridItem>
      <GridItem colSpan={9}>
        <InnerGrid
          templateColumns="repeat(3, 280px)"
          gridGap={10}
          marginLeft={-4}
        >
          {apps.map((app, index) => {
            if (index === 0) {
              return (
                <GridItem
                  colSpan={3}
                  key={app.id}
                  background="gray.100"
                  borderRadius={10}
                  p={4}
                  height="240"
                >
                  <Heading as="h3" size="md">
                    {app.name || app.slug}
                  </Heading>
                  <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
                    <Text textColor="brandPurple">View more</Text>
                  </NextLink>
                </GridItem>
              );
            }

            return (
              <GridItem
                key={app.id}
                height={240}
                background="gray.100"
                borderRadius={10}
                p={4}
              >
                <Heading as="h3" size="md">
                  {app.name || app.slug}
                </Heading>
                <NextLink href={`/app/${app.id}`}>
                  <Text textColor="brandPurple">View more</Text>
                </NextLink>
              </GridItem>
            );
          })}
        </InnerGrid>
      </GridItem>
    </DefaultGrid>
  );
}
