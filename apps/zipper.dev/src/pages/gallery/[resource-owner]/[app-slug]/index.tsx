import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import Header from '~/components/header';
import { useAppOwner } from '~/hooks/use-app-owner';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';
import { useState } from 'react';

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
} from '@chakra-ui/react';
import Editor from '@monaco-editor/react';

import Link from 'next/link';
import { baseColors, Markdown } from '@zipper/ui';
import { HiChevronDown, HiOutlineTemplate } from 'react-icons/hi';
import { HiChevronDoubleLeft } from 'react-icons/hi2';

const AppletLandingPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { getAppOwner } = useAppOwner();
  const resourceOwnerSlug = router.query['resource-owner'] as string;
  const appSlug = router.query['app-slug'] as string;
  const [currentScript, setCurrentScript] = useState<string>('readme.md');
  const theme = useColorModeValue('vs', 'vs-dark');

  const appQuery = trpc.app.byResourceOwnerAndAppSlugs.useQuery(
    { resourceOwnerSlug, appSlug },
    { retry: false },
  );

  if (appQuery.isLoading || !appQuery.data) {
    return <></>;
  }

  const { data } = appQuery;

  const APPROXIMATE_HEADER_HEIGHT_PX = '116px';
  const CODE_PREVIEW_HEIGHT = `calc(100vh - ${APPROXIMATE_HEADER_HEIGHT_PX})`;
  const MIN_CODE_PREVIEW_HEIGHT = 500;

  const getScriptCode = (filename: string) => {
    return (
      data.scripts.find((script) => script.filename === filename)?.code ?? null
    );
  };

  return (
    <VStack alignItems="start" flex={1} px={10} spacing={8}>
      <HStack
        spacing={8}
        borderBottom="1px"
        borderColor="gray.200"
        pb={8}
        w="full"
      >
        <Heading>Package.json Explorer</Heading>
        <Button
          variant="solid"
          colorScheme="purple"
          leftIcon={<HiOutlineTemplate size={20} />}
        >
          <Link href="/gallery">Back to Gallery</Link>
        </Button>
      </HStack>

      <VStack w="full" spacing={6}>
        <HStack w="full" h={10} spacing={6}>
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
              {currentScript}
            </MenuButton>

            <MenuList>
              {data.scripts.map((script) => (
                <MenuItem onClick={() => setCurrentScript(script.filename)}>
                  {script.filename}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          <Button
            size="sm"
            padding={2}
            leftIcon={<HiChevronDoubleLeft size={20} />}
          >
            <Link
              href={`/${data.resourceOwner.slug}/${data.slug}/src/${currentScript}`}
            >
              Explore this applet's code
            </Link>
          </Button>
        </HStack>
        <HStack
          w="full"
          h={'xl'}
          spacing={8}
          alignContent="start"
          alignItems="start"
        >
          <VStack
            height={CODE_PREVIEW_HEIGHT}
            minHeight={MIN_CODE_PREVIEW_HEIGHT}
            w="60%"
            align="start"
          >
            {currentScript && currentScript === 'readme.md' ? (
              <Markdown>
                {getScriptCode(currentScript) ?? 'No readme found'}
              </Markdown>
            ) : (
              <>
                <Box w="full" height="full" paddingTop={6}>
                  <Editor
                    defaultLanguage="typescript"
                    defaultValue={getScriptCode(currentScript) ?? ''}
                    theme={theme}
                    options={{
                      minimap: { enabled: false },
                      automaticLayout: true,
                      readOnly: true,
                      scrollbar: { vertical: 'hidden' },
                    }}
                    onMount={(_, monaco) => {
                      monaco.editor.defineTheme('vs-dark', {
                        base: 'vs',
                        inherit: true,
                        rules: [],
                        colors: {
                          'editor.background': baseColors.gray[800],
                        },
                      });
                    }}
                    width="99%"
                  />
                </Box>
                {/* Overlay for disabling editor interactions */}
                <Box
                  backgroundColor="transparent"
                  position="absolute"
                  width="full"
                  height="full"
                ></Box>
              </>
            )}
          </VStack>
          <Box flex={1} bgColor="pink" h={'full'}></Box>
        </HStack>
      </VStack>
    </VStack>
  );
};

AppletLandingPage.skipAuth = true;
AppletLandingPage.header = (page) => {
  return <Header showNav={!page.subdomain as boolean} />;
};

export default AppletLandingPage;
