import NextLink from 'next/link';
import {
  Badge,
  Box,
  Card,
  CardBody,
  GridItem,
  Heading,
  HStack,
  Stack,
  VStack,
  Image,
  Grid,
} from '@chakra-ui/react';
import React from 'react';
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
          if (index === 0) {
            return (
              <GridItem colSpan={3} key={app.id}>
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
                      {/* TODO get a generated image */}
                      <Box flex={1} height={48}>
                        <Image
                          src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
                          alt="Green double couch with wooden legs"
                          width="full"
                          height="full"
                          objectFit="cover"
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
          }

          return (
            <>
              <GridItem key={app.id}>
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
                      paddingBottom={6}
                    >
                      {/* TODO get a generated image */}
                      <Image
                        src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
                        alt="Green double couch with wooden legs"
                      />
                      <Stack spacing="1" width="full" paddingX={4}>
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
            </>
          );
        })}
      </Grid>
    </Box>
  );
}
