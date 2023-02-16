import NextLink from 'next/link';
import {
  Badge,
  Box,
  Card,
  CardBody,
  Grid as InnerGrid,
  GridItem,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
  VStack,
  Image,
} from '@chakra-ui/react';
import React from 'react';
import DefaultGrid from '~/components/default-grid';
import { HiSparkles } from 'react-icons/hi';
import { SignedIn } from '@clerk/nextjs';
import { GalleryAppQueryOutput } from '~/pages';

// TODO get the badges from api
const badges: string[] = [];

export function Gallery({
  apps,
  heading,
}: {
  apps: GalleryAppQueryOutput;
  heading?: string;
}) {
  return (
    <Box mt={14}>
      <DefaultGrid mb={6}>
        <GridItem colSpan={12}>
          <Heading>{heading}</Heading>
        </GridItem>
      </DefaultGrid>
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
                    <Heading as="h2" size="md">
                      {app.name || app.slug}
                    </Heading>
                    <NextLink href={`/${app.resourceOwner.slug}/${app.slug}`}>
                      <Text textColor="brandPurple">View more</Text>
                    </NextLink>
                  </GridItem>
                );
              }

              return (
                <GridItem key={app.id}>
                  <NextLink href={`/${app.resourceOwner.slug}/${app.id}`}>
                    <Card
                      width="full"
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
                        paddingBottom={6}
                      >
                        {/* TODO get a generated image */}
                        <Image
                          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
                          alt="Green double couch with wooden legs"
                        />
                        <Stack spacing="1" paddingX={4}>
                          <Heading
                            as="h3"
                            size="sm"
                            color="gray.800"
                            fontWeight="normal"
                          >
                            {app.resourceOwner.slug}
                          </Heading>
                          <Heading as="h2" size="md">
                            {app.name || app.slug}
                          </Heading>
                          <VStack alignItems="stretch">
                            {badges.length > 0 && (
                              <HStack paddingY={1}>
                                {badges.map((badge) => (
                                  <Badge
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
            })}
          </InnerGrid>
        </GridItem>
      </DefaultGrid>
    </Box>
  );
}
