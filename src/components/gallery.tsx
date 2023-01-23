import { trpc } from '../utils/trpc';
import NextLink from 'next/link';
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid as InnerGrid,
  GridItem,
  Heading,
  HStack,
  Input,
  Link,
  VStack,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import React from 'react';
import DefaultGrid from '~/components/default-grid';
import { HiSparkles } from 'react-icons/hi';
import { useRouter } from 'next/router';
import { appSubmissionState } from '~/types/appSubmissionState';
import { SignedIn } from '@clerk/nextjs';

export function Gallery() {
  const utils = trpc.useContext();
  const router = useRouter();
  const appQuery = trpc.useQuery([
    'app.all',
    { submissionState: appSubmissionState.approved },
  ]);
  const addApp = trpc.useMutation('app.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.all']);
    },
  });
  const { register, handleSubmit } = useForm();

  return (
    <DefaultGrid>
      <GridItem colSpan={3}>
        <VStack alignItems="start" spacing={2} w={280}>
          <SignedIn>
            <HStack>
              <HiSparkles />
              <Link fontWeight={600} onClick={() => router.push('/mine')}>
                My apps
              </Link>
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
