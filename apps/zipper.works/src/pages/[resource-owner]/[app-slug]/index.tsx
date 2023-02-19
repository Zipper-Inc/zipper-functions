import {
  Button,
  Heading,
  HStack,
  Text,
  Link,
  VStack,
  Box,
  Flex,
} from '@chakra-ui/react';
import Editor from '@monaco-editor/react';
import { GetServerSideProps } from 'next';
import NextError from 'next/error';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { EditorNav } from '~/components/editor/editor-nav';
import Header from '~/components/header';
import { useAppOwner } from '~/hooks/use-app-owner';
import { NextPageWithLayout } from '~/pages/_app';
import { getValidSubdomain } from '~/utils/subdomains';
import { trpc } from '~/utils/trpc';

const APPROXIMATE_HEADER_HEIGHT_PX = '116px';
const CODE_PREVIEW_HEIGHT = `calc(100vh - ${APPROXIMATE_HEADER_HEIGHT_PX})`;
const MIN_CODE_PREVIEW_HEIGHT = 500;

const AppPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { getAppOwner } = useAppOwner();
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
  const appOwner = getAppOwner(data);

  return (
    <HStack gap={4} pl={10} mt="14" mr={0} alignItems="stretch">
      <VStack flex={2} gap={4} alignItems="start">
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
            <HStack alignItems="start">
              <Text flex={1} color="gray.700">
                Built by
              </Text>
              <Text
                flex={1}
                color="purple.600"
                overflow="auto"
                whiteSpace="nowrap"
              >
                {appOwner.name}
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
                {/* TODO figure out relative time (d, w, m ago) */}
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
      <HStack position="relative" flex={3}>
        <Link
          href={`/${resourceOwnerSlug}/${appSlug}/edit/${
            appQuery.data.scriptMain?.script.filename || 'main.ts'
          }`}
          _hover={{ textDecoration: 'none' }}
          flex={1}
        >
          <HStack
            overflow="hidden"
            spacing={0}
            height={CODE_PREVIEW_HEIGHT}
            minHeight={MIN_CODE_PREVIEW_HEIGHT}
            alignItems="stretch"
            justifyContent="center"
          >
            <VStack
              flex={1}
              background="linear-gradient(326.37deg, #3E1C96 8.28%, rgba(62, 28, 150, 0) 100.06%), #89279B;"
              borderTopLeftRadius={12}
              padding={6}
              spacing={6}
              alignItems="start"
            >
              <EditorNav app={data} />
            </VStack>
            <Flex flex={2} position="relative">
              <Box width="full" paddingTop={6}>
                <Editor
                  defaultLanguage="typescript"
                  defaultValue={data.scriptMain?.script.code}
                  theme="vs-light"
                  options={{
                    minimap: { enabled: false },
                    automaticLayout: true,
                    readOnly: true,
                  }}
                  width="99%"
                />
              </Box>
              {/* Overlay for disabling editor interactions */}
              <Box
                backgroundColor="blackAlpha.50"
                position="absolute"
                width="full"
                height="full"
              ></Box>
            </Flex>
          </HStack>
        </Link>
        <Box position="absolute" top="90%" transform="translateX(-15%)">
          <Button
            colorScheme="blue"
            paddingX={6}
            onClick={() => {
              window.location.href = `/${resourceOwnerSlug}/${appSlug}/edit/${
                appQuery.data.scriptMain?.script.filename || 'main.ts'
              }`;
            }}
            _hover={{ transform: 'scale(1.1)' }}
          >
            Explore This App
          </Button>
        </Box>
      </HStack>
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
