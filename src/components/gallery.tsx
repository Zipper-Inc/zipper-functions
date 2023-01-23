import { trpc } from '../utils/trpc';
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
import { appSubmissionState } from '~/types/appSubmissionState';
import { SignedIn } from '@clerk/nextjs';

export function Gallery() {
  const appQuery = trpc.useQuery([
    'app.all',
    { submissionState: appSubmissionState.approved },
  ]);

  return (
    <DefaultGrid>
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
          {appQuery.data?.map((app, index) => {
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
                  <NextLink href={`/app/${app.id}`}>
                    <Link textColor="brandPurple">View more</Link>
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
                  <Link textColor="brandPurple">View more</Link>
                </NextLink>
              </GridItem>
            );
          })}
        </InnerGrid>
      </GridItem>
    </DefaultGrid>
  );
}
