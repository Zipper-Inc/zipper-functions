import {
  HStack,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Progress,
  VStack,
  ChakraProps,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Tooltip,
  MenuDivider,
  Heading,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Flex,
  Text,
  useDisclosure,
  useColorMode,
} from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import SecretsTab from '~/components/playground/tab-secrets';
import SchedulesTab from '~/components/playground/tab-schedules';
import SettingsTab from './tab-settings';
import { PlaygroundHeader } from './playground-header';
import { CodeTab } from './tab-code';
import { useEditorContext } from '../context/editor-context';
import { Script } from '@prisma/client';
import { AppQueryOutput } from '~/types/trpc';
import { parsePlaygroundQuery, PlaygroundTab } from '~/utils/playground.utils';
import { RunAppProvider } from '../context/run-app-context';
import { PlaygroundAvatars } from './playground-avatars';
import { useAppEditors } from '~/hooks/use-app-editors';
import { primaryColors, TabButton } from '@zipper/ui';
import HistoryTab from './tab-runs';
import VersionsTab from './tab-versions';
import { useRouter } from 'next/router';
import { IconButton } from '@chakra-ui/react';
import { QuestionOutlineIcon } from '@chakra-ui/icons';
import {
  FiBook,
  FiBookOpen,
  FiChevronLeft,
  FiCrosshair,
  FiX,
} from 'react-icons/fi';
import {
  useHelpMode,
  inspectableComponents,
  useHelpBorder,
} from '../context/help-mode-context';

import { HiOutlineMegaphone } from 'react-icons/hi2';
import { FeedbackModal } from '~/components/auth/feedback-modal';
import { useTheme } from 'next-themes';

const tabPanelStyles: ChakraProps = {
  flex: 1,
  p: 0,
  pt: 5,
  display: 'flex',
  flexDirection: 'column',
};

export function Playground({
  app,
  tab = PlaygroundTab.Code,
  filename = 'main.ts',
}: {
  app: AppQueryOutput;
  tab: PlaygroundTab;
  filename?: string;
}) {
  const { editorIds, onlineEditorIds, selfId } = useAppEditors();

  const [tabIndex, setTabIndex] = useState(
    Object.values(PlaygroundTab).indexOf(tab),
  );

  const { id } = app;

  const {
    setCurrentScript,
    save,
    isSaving,
    addLog,
    setLogStore,
    preserveLogs,
    resourceOwnerSlug,
    appSlug,
  } = useEditorContext();

  const makeHref = (tabToLink: PlaygroundTab = tab) => {
    const parts = [resourceOwnerSlug, appSlug, tabToLink];
    if (tabToLink === PlaygroundTab.Code && filename) parts.push(filename);
    return `/${parts.join('/')}`;
  };

  const mainScript = app.scripts.find(
    (script) => script.id === app.scriptMain?.scriptId,
  ) as Script;

  useEffect(() => {
    const initialScript =
      app.scripts.find((script: Script) => script.filename === filename) ||
      mainScript;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    setCurrentScript(initialScript!);
  }, [filename]);

  const router = useRouter();

  useEffect(() => {
    const { tab: currentTab } = parsePlaygroundQuery(router.query);
    setTabIndex(Object.values(PlaygroundTab).indexOf(currentTab));
  }, [router.query]);
  const onAfterRun = async () => {
    setTabIndex(0);
  };

  const saveAppBeforeRun = async () => {
    if (app.canUserEdit) {
      return save();
    } else {
      return app.playgroundVersionHash || app.publishedVersionHash || '';
    }
  };

  const {
    helpModeEnabled,
    toggleHelpMode,
    elementDescription,
    hoveredElement,
  } = useHelpMode();

  const { onMouseEnter, onMouseLeave } = useHelpBorder();
  const feedbackModal = useDisclosure();
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  return (
    <RunAppProvider
      app={app}
      saveAppBeforeRun={saveAppBeforeRun}
      addLog={addLog}
      setLogStore={setLogStore}
      onAfterRun={onAfterRun}
      preserveLogs={preserveLogs}
    >
      <VStack flex={1} paddingX={10} alignItems="stretch" spacing={0}>
        <PlaygroundHeader app={app} />

        <Tabs
          colorScheme="purple"
          index={tabIndex}
          onChange={(index) => {
            const href = makeHref(Object.values(PlaygroundTab)[index]);
            router.push(href, undefined, { shallow: true });
          }}
          display="flex"
          flexDirection="column"
          justifyContent="stretch"
          isLazy
        >
          <TabList
            borderBottom="1px solid"
            borderColor={'fg.100'}
            p={1}
            pb={4}
            mb={2}
            pt={3}
            color="fg.500"
            gap={2}
            justifyContent="space-between"
            overflowX="auto"
            hidden={!app.canUserEdit}
          >
            <HStack spacing={2} flex={4}>
              {/* CODE */}
              <div
                onMouseEnter={onMouseEnter('CodeTab')}
                onMouseLeave={onMouseLeave}
              >
                <TabButton title="Code" href={makeHref(PlaygroundTab.Code)} />
              </div>

              {/* SCHEDULES */}
              <div
                onMouseEnter={onMouseEnter('ScheduleTab')}
                onMouseLeave={onMouseLeave}
              >
                <TabButton
                  title="Schedules"
                  href={makeHref(PlaygroundTab.Schedules)}
                />
              </div>
              {/* SECRETS */}

              <div
                onMouseEnter={onMouseEnter('SecretsTab')}
                onMouseLeave={onMouseLeave}
              >
                <TabButton
                  title="Secrets"
                  href={makeHref(PlaygroundTab.Secrets)}
                />
              </div>

              {/* RUNS */}
              <div
                onMouseEnter={onMouseEnter('RunsTab')}
                onMouseLeave={onMouseLeave}
              >
                <TabButton title="Runs" href={makeHref(PlaygroundTab.Runs)} />
              </div>

              {/* VERSIONS */}
              <div
                onMouseEnter={onMouseEnter('VersionsTab')}
                onMouseLeave={onMouseLeave}
              >
                <TabButton
                  title="Versions"
                  href={makeHref(PlaygroundTab.Versions)}
                />
              </div>
              {/* SETTINGS */}
              <div
                onMouseEnter={onMouseEnter('SettingsTab')}
                onMouseLeave={onMouseLeave}
              >
                <TabButton
                  title="Settings"
                  href={makeHref(PlaygroundTab.Settings)}
                />
              </div>
            </HStack>
            {editorIds.length > 1 && (
              <PlaygroundAvatars
                editorIds={editorIds}
                onlineEditorIds={onlineEditorIds}
                selfId={selfId}
              />
            )}
          </TabList>
          {/* TAB PANELS */}
          <TabPanels as={VStack} alignItems="stretch" h="full" spacing={0}>
            {/* CODE */}
            <TabPanel position="relative" {...tabPanelStyles}>
              {isSaving && (
                <Progress
                  isIndeterminate
                  colorScheme="purple"
                  position="absolute"
                  left={0}
                  right={0}
                  top="0"
                  height="2px"
                  background="transparent"
                />
              )}
              <CodeTab
                app={app}
                mainScript={mainScript}
                helpMode={helpModeEnabled}
              />
            </TabPanel>

            {/* SCHEDULES */}
            <TabPanel {...tabPanelStyles}>
              <SchedulesTab appId={id} />
            </TabPanel>

            {/* SECRETS */}
            <TabPanel {...tabPanelStyles}>
              <SecretsTab editable={app.canUserEdit} appId={id} />
            </TabPanel>

            {/* RUNS */}
            <TabPanel {...tabPanelStyles}>
              <HistoryTab appId={id} />
            </TabPanel>

            {/* VERSIONS */}
            <TabPanel {...tabPanelStyles}>
              <VersionsTab appId={id} slug={app.slug} />
            </TabPanel>

            {/* SETTINGS */}
            {app.canUserEdit && (
              <TabPanel {...tabPanelStyles}>
                <SettingsTab app={app} />
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
        <Box
          position={'fixed'}
          bottom={10}
          left={10}
          zIndex={10}
          display="flex"
          gap={2}
        >
          <Menu closeOnSelect={false}>
            {({ onClose }) => (
              <>
                <Tooltip
                  label="Help & Docs"
                  bg="transparent"
                  boxShadow="lg"
                  color="fg.700"
                  marginBottom={4}
                  marginLeft={10}
                  px={4}
                  pb={2}
                >
                  <MenuButton
                    as={IconButton}
                    aria-label="Options"
                    w={'30px'}
                    icon={<QuestionOutlineIcon color="primary" />}
                    variant="outline"
                    rounded="full"
                    border="none"
                    boxShadow="md"
                    zIndex="10"
                    _hover={{
                      bg: 'primary.25',
                    }}
                  />
                </Tooltip>

                <MenuList pt={0}>
                  {!helpModeEnabled ? (
                    <>
                      <Box
                        display={'flex'}
                        flexDirection={'row'}
                        justifyContent={'space-between'}
                        alignItems={'center'}
                        py={2}
                        px={2}
                      >
                        <Heading color="primary" size="sm" p={2}>
                          Help & Docs
                        </Heading>
                        <Button
                          onClick={() => onClose()}
                          bg="transparent"
                          _hover={{ backgroundColor: 'transparent' }}
                        >
                          <FiX size={20} color="gray" />
                        </Button>
                      </Box>

                      <MenuItem
                        color="fg.700"
                        icon={<FiBook size={20} color="#98A2B3" />}
                        onClick={() =>
                          window.open('https://zipper.dev/docs', '_blank')
                        }
                      >
                        Zipper quickstart
                      </MenuItem>
                      <MenuItem
                        color="fg.700"
                        icon={<FiBook size={20} color="#98A2B3" />}
                        onClick={() =>
                          window.open(
                            'https://zipper.dev/docs/introduction/basic-concepts',
                            '_blank',
                          )
                        }
                      >
                        Basic concepts
                      </MenuItem>
                      <MenuItem
                        color="fg.700"
                        icon={<FiBook size={20} color="#98A2B3" />}
                        onClick={() =>
                          window.open(
                            'https://zipper.dev/docs/introduction/what-you-can-build',
                            '_blank',
                          )
                        }
                      >
                        What you can build
                      </MenuItem>
                      <MenuDivider color="fg.100" />

                      <MenuItem
                        color="fg.700"
                        icon={<FiBookOpen size={20} color="#98A2B3" />}
                        onClick={() =>
                          window.open('https://zipper.dev/docs', '_blank')
                        }
                      >
                        Browse Documentation
                      </MenuItem>
                      <MenuItem
                        color="fg.700"
                        icon={<FiCrosshair size={20} color="#98A2B3" />}
                        onClick={toggleHelpMode}
                      >
                        Inspect UI
                      </MenuItem>

                      {/* <MenuItem
                        color="fg.700"
                        icon={<FiChrome size={20} color="#98A2B3" />}
                      >
                        Contact support
                      </MenuItem> */}
                    </>
                  ) : (
                    <>
                      <Box
                        display={'flex'}
                        flexDirection={'column'}
                        pt={2}
                        px={2}
                        maxW={237}
                        minH={'200px'}
                      >
                        <Flex
                          alignItems={'center'}
                          justifyContent={'space-between'}
                          mb={4}
                        >
                          <FiChevronLeft
                            size={20}
                            color="gray"
                            onClick={toggleHelpMode}
                            cursor="pointer"
                          />

                          <Heading color="purple.600" size="sm" flex="1" ml={2}>
                            Inspect UI
                          </Heading>
                          <FiX
                            size={20}
                            color="gray"
                            onClick={onClose}
                            cursor="pointer"
                          />
                        </Flex>
                        <Text
                          color={'fg.900'}
                          fontSize="md"
                          fontWeight="bold"
                          mb={2}
                        >
                          {hoveredElement
                            ? inspectableComponents[hoveredElement]?.name
                            : ''}
                        </Text>
                        <Text color={'fg.600'} fontSize="sm">
                          {elementDescription
                            ? elementDescription
                            : 'Hover over the interface to learn more about what it does.'}
                        </Text>
                      </Box>
                    </>
                  )}
                </MenuList>
              </>
            )}
          </Menu>
          <Button
            aria-label="Options"
            variant="outline"
            rounded="full"
            border="none"
            boxShadow="lg"
            zIndex="10"
            p={0}
            _hover={{
              bg: 'primary.25',
            }}
            onClick={feedbackModal.onOpen}
          >
            <HiOutlineMegaphone
              color={
                isDark
                  ? primaryColors.primary._dark
                  : primaryColors.primary.default
              }
              size={16}
            />
          </Button>
        </Box>
        <FeedbackModal {...feedbackModal} />
      </VStack>
    </RunAppProvider>
  );
}
