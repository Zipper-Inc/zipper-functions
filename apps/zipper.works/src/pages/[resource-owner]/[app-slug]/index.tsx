import {
  Button,
  Heading,
  HStack,
  Link,
  Table,
  TableContainer,
  Tbody,
  Td,
  Tr,
  Text,
  VStack,
  Box,
} from '@chakra-ui/react';
import { useUser } from '@clerk/nextjs';
import Editor from '@monaco-editor/react';
import { GetServerSideProps } from 'next';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import { HiArrowRight } from 'react-icons/hi';
import { EditorNav } from '~/components/editor/editor-nav';
import Header from '~/components/header';
import { NextPageWithLayout } from '~/pages/_app';
import { getValidSubdomain, removeSubdomains } from '~/utils/subdomains';
import { trpc } from '~/utils/trpc';

const APPROXIMATE_HEADER_HEIGHT_PX = '116px';
const CODE_PREVIEW_HEIGHT = `calc(100vh - ${APPROXIMATE_HEADER_HEIGHT_PX})`;

const AppPage: NextPageWithLayout = () => {
  const router = useRouter();
  const headline = 'Turn a meeting into a task list';

  const resourceOwnerSlug = router.query['resource-owner'] as string;
  const appSlug = router.query['app-slug'] as string;

  const appQuery = trpc.useQuery([
    'app.byResourceOwnerAndAppSlugs',
    { resourceOwnerSlug, appSlug },
  ]);

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 404}
      />
    );
  }

  if (appQuery.isLoading || !appQuery.data) {
    return <></>;
  }

  const { data } = appQuery;
  return (
    <HStack
      gap={4}
      pl={10}
      mt="14"
      mr={0}
      alignItems="start"
      position="relative"
    >
      <VStack flex={2} gap={4} alignItems="start" w={560}>
        <Heading as="h1" size="2xl" fontWeight="bold" overflowWrap="normal">
          {headline}
        </Heading>
        <Heading as="h2" color="purple.700" fontSize="2xl">
          {data.name || data.slug}
        </Heading>

        <VStack spacing={4} align={'start'} minW="full">
          {data.description && (
            <>
              <Text fontWeight={700}>About this app</Text>
              <Text fontSize="lg">{data.description}</Text>
            </>
          )}
        </VStack>
        <HStack alignSelf="stretch" alignItems="start" mt={5}>
          <VStack alignItems="stretch" flex={1}>
            <HStack>
              <Text flex={1} color="gray.700">
                Built by
              </Text>
              <Text flex={1} color="purple.600">
                {resourceOwnerSlug}
              </Text>
            </HStack>
            <HStack overflow="hidden" minWidth={0}>
              <Text flex={1} color="gray.700">
                Updated
              </Text>
              <Text
                flex={1}
                color="purple.600"
                overflow="auto"
                whiteSpace="nowrap"
              >
                {new Intl.DateTimeFormat('en-GB', {
                  dateStyle: 'short',
                }).format(data?.updatedAt || undefined)}
              </Text>
            </HStack>
          </VStack>
          <HStack flex={1} alignItems="stretch">
            {/* TODO get categories from app metadata */}
            {/* <Text color="gray.700" flex={1}>
              Categories
            </Text>
            <VStack flex={2} alignItems="stretch">
              <Text color="purple.600">Artifical Intelligence </Text>
              <Text color="purple.600">Project Management</Text>
              <Text color="purple.600"> Speech to Text</Text>
            </VStack> */}
          </HStack>
        </HStack>
      </VStack>
      <HStack
        flex={3}
        overflow="hidden"
        spacing={0}
        height={CODE_PREVIEW_HEIGHT}
        alignItems="stretch"
      >
        <VStack
          flex={1}
          background="linear-gradient(326.37deg, #3E1C96 8.28%, rgba(62, 28, 150, 0) 100.06%), #89279B;"
          borderTopLeftRadius={12}
          padding={6}
          alignItems="stretch"
          spacing={6}
        >
          <EditorNav app={data} />
        </VStack>
        <Box flex={2}>
          <Editor
            defaultLanguage="typescript"
            defaultValue={data.scriptMain?.script.code}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              automaticLayout: true,
              readOnly: true,
            }}
          />
        </Box>
      </HStack>
      <Box position="absolute" top="80vh" left="40%">
        <Button
          colorScheme="blue"
          paddingX={6}
          onClick={() => {
            router.push(
              `/${resourceOwnerSlug}/${appSlug}/edit/${
                appQuery.data.scriptMain?.script.filename || 'main.ts'
              }`,
            );
          }}
        >
          Explore This App
        </Button>
      </Box>
    </HStack>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);

  if (subdomain) {
    return {
      props: {
        subdomain,
      },
    };
  }

  return { props: {} };
};

AppPage.skipAuth = true;
AppPage.header = (page) => {
  return <Header showNav={!page.subdomain as boolean} />;
};

export default AppPage;
