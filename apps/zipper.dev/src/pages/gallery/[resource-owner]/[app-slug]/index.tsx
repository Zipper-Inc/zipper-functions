import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

import {
  Button,
  Heading,
  HStack,
  Menu,
  MenuItem,
  MenuButton,
  MenuList,
  VStack,
  Box,
  useColorModeValue,
  CloseButton,
  Text,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { Script } from '@prisma/client';
import Editor, { EditorProps, Monaco } from '@monaco-editor/react';
import { HiArrowLeft, HiChevronDown, HiOutlineTemplate } from 'react-icons/hi';
import Link from 'next/link';
import { baseColors, Markdown, AppletAuthor, TabButton } from '@zipper/ui';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';
import { isReadme } from '~/utils/playground.utils';
import type { MonacoEditor } from '~/components/playground/playground-editor';

const EDITOR_OPTIONS = {
  fixedOverflowWidgets: true,
  lineNumbers: 'on',
  tabSize: 2,
  insertSpaces: false,
  minimap: {
    enabled: false,
  },
  fontSize: 13,
  automaticLayout: true,
  readOnly: true,
  renderLineHighlight: 'none',
  scrollBeyondLastLine: false,
  scrollbar: {
    vertical: 'hidden',
    horizontal: 'hidden',
  },
  contextmenu: false,
} as const satisfies EditorProps['options'];

const AppletLandingPage: NextPageWithLayout = () => {
  const router = useRouter();
  const resourceOwnerSlug = router.query['resource-owner'] as string;
  const appSlug = router.query['app-slug'] as string;
  const [currentScriptState, setCurrentScriptState] = useState<
    Script | undefined
  >(undefined);
  const [isBoxVisible, setIsBoxVisible] = useState(true);

  const theme = useColorModeValue('vs', 'vs-dark');

  const appQuery = trpc.app.byResourceOwnerAndAppSlugs.useQuery(
    { resourceOwnerSlug, appSlug },
    { retry: false },
  );

  useEffect(() => {
    if (appQuery.data) {
      setCurrentScriptState(
        appQuery.data.scripts.find((s) => s.filename === 'main.ts'),
      );
    }
  }, [appQuery.data]);

  if (appQuery.isLoading || !appQuery.data) {
    return <></>;
  }

  const { data } = appQuery;

  const MIN_CODE_PREVIEW_HEIGHT = 500;
  const getScriptCode = (filename = 'main.ts') => {
    return (
      data.scripts.find((script) => script.filename === filename)?.code ?? ''
    );
  };

  const getAppRunUrl =
    process.env.NODE_ENV === 'production'
      ? `https://${data.slug}.zipper.run`
      : `http://${data.slug}.localdev.me:3002`;

  const runIframe = () => {
    return (
      <iframe
        width="100%"
        height="500"
        src={`${getAppRunUrl}/embed/run/${
          currentScriptState?.filename || 'main.ts'
        }`}
      ></iframe>
    );
  };

  const handleEditorDidMount = (editor: MonacoEditor, monaco: Monaco) => {
    monaco.editor.defineTheme('vs-dark', {
      inherit: true,
      base: 'vs-dark',
      rules: [],
      colors: {
        'editor.background': baseColors.gray[800],
        'dropdown.background': baseColors.gray[800],
        'editorWidget.background': baseColors.gray[800],
        'input.background': baseColors.gray[800],
      },
    });
  };

  return (
    <VStack alignItems="start" flex={1} px={10}>
      {data.submissionState === 3 && (
        <Button variant="link" as={Link} href="/gallery">
          <HStack>
            <Icon as={HiArrowLeft} />
            <Text>Back to Gallery</Text>
          </HStack>
        </Button>
      )}
      <HStack spacing={8} pb={6} justifyContent="space-between" w="full">
        <Heading>{data.name ?? data.slug}</Heading>
        <Button
          variant="solid"
          colorScheme="purple"
          leftIcon={<HiOutlineTemplate size={20} />}
          fontSize="sm"
        >
          <Link href={`/${data.resourceOwner.slug}/${data.slug}/src`}>
            Open in Playground
          </Link>
        </Button>
      </HStack>

      <VStack spacing={6} w="full">
        <HStack
          w="full"
          h={'xl'}
          spacing={16}
          alignContent="start"
          alignItems="start"
        >
          <VStack align="start" minW={400}>
            <AppletAuthor
              author={{
                name: data.appAuthor.name,
                organization: data.appAuthor.organization,
                image: data.appAuthor.image,
                orgImage: data.appAuthor.orgImage,
              }}
            />
            <Stack pt={4}>
              <Markdown>
                {getScriptCode('readme.md') ?? 'No readme found'}
              </Markdown>
            </Stack>
          </VStack>

          <VStack w="full" alignItems="start">
            {isBoxVisible && (
              <Box p={4} bgColor="lightBlue.50" w="full" position="relative">
                <CloseButton
                  alignSelf="flex-end"
                  position={'absolute'}
                  top={'10px'}
                  right={'10px'}
                  size="sm"
                  color="lightBlue.200"
                  onClick={() => {
                    setIsBoxVisible(false);
                  }}
                />
                <Text
                  as="h6"
                  fontWeight="medium"
                  color="lightBlue.800"
                  fontSize={18}
                >
                  Take{' '}
                  <Text as="span" fontWeight="bold">
                    {data.name || data.slug}
                  </Text>{' '}
                  for a test drive
                </Text>
                <Text color="lightBlue.800" fontWeight="400">
                  Run the applet preview below or explore the code to see if it
                  fits your needs. <br />
                  When you’re ready, customize the applet in the playground.
                </Text>
              </Box>
            )}
            <Box border="1px solid" borderColor="fg.200" w="full" p={4}>
              <HStack w="full" justifyContent="space-between">
                <Tabs
                  colorScheme="purple"
                  display="flex"
                  flexDirection="column"
                  justifyContent="stretch"
                  flex={1}
                  isLazy
                >
                  <TabList
                    borderBottom="0px"
                    borderColor={'fg.100'}
                    pb={4}
                    mb={2}
                    color="fg.500"
                    gap={2}
                    overflowX="auto"
                  >
                    <HStack justifyContent="space-between" w="full">
                      <Menu>
                        <MenuButton
                          variant="ghost"
                          size="md"
                          margin={0}
                          padding={0}
                          colorScheme="purple"
                          as={Button}
                          rightIcon={<HiChevronDown />}
                          _expanded={{ bg: 'transparent' }}
                          _hover={{ bg: 'transparent' }}
                        >
                          {currentScriptState?.filename || 'main.ts'}
                        </MenuButton>

                        <MenuList>
                          {data.scripts.map(
                            (script) =>
                              !isReadme(script) && (
                                <MenuItem
                                  key={script.filename}
                                  onClick={() => {
                                    setCurrentScriptState(script);
                                  }}
                                >
                                  {script.filename}
                                </MenuItem>
                              ),
                          )}
                        </MenuList>
                      </Menu>
                      <HStack>
                        {currentScriptState?.isRunnable && (
                          <TabButton title="Preview" />
                        )}
                        <TabButton title="Code" />
                      </HStack>
                    </HStack>
                  </TabList>
                  <TabPanels
                    as={VStack}
                    alignItems="stretch"
                    h="full"
                    spacing={0}
                  >
                    {currentScriptState?.isRunnable && (
                      <TabPanel p={0}>{runIframe()}</TabPanel>
                    )}
                    <TabPanel p={0}>
                      <Flex
                        p={0}
                        flex={2}
                        position="relative"
                        h={MIN_CODE_PREVIEW_HEIGHT}
                      >
                        <Box width="full" overflowY="scroll" p={0}>
                          <Editor
                            defaultLanguage="typescript"
                            value={getScriptCode(
                              currentScriptState?.filename || 'main.ts',
                            )}
                            theme={theme}
                            options={EDITOR_OPTIONS}
                            onMount={handleEditorDidMount}
                          />
                        </Box>
                      </Flex>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </HStack>
            </Box>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  );
};

AppletLandingPage.skipAuth = true;

export default AppletLandingPage;
