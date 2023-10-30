import {
  Box,
  Button,
  ChakraProps,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { InputParam, InputParams, ZipperLocation } from '@zipper/types';
import { getAppLink, getInputsFromFormData } from '@zipper/utils';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  HiChevronLeft,
  HiOutlineChevronDown,
  HiOutlineChevronUp,
} from 'react-icons/hi';
import { HiArrowTopRightOnSquare } from 'react-icons/hi2';
import { useAppletContent } from '../../hooks/use-applet-content';
import { useEffectOnce } from '../../hooks/use-effect-once';
import { ErrorBoundary } from '../error-boundary';
import { FunctionInputs } from '../function-inputs';
import FunctionOutputProvider from './function-output-context';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import SmartFunctionOutputProvider from './smart-function-output-context';
import { FunctionOutputProps } from './types';
import { parseResult } from './utils';

const stickyTabsStyles: ChakraProps = {
  top: -4,
  position: 'sticky',
  zIndex: 1,
};
const tabsStyles: ChakraProps = {
  display: 'flex',
  flexDir: 'column',
  gap: 0,
  width: 'full',
  height: 'full',
};
const tablistStyles: ChakraProps = {
  gap: 1,
  border: '1px',
  color: 'fg.500',
  bg: 'fg.100',
  borderColor: 'fg.200',
  p: 2,
  w: 'full',
};
const tabButtonStyles: ChakraProps = {
  rounded: 'lg',
  py: 1,
  px: 2,
  _selected: {
    fontWeight: 'bold',
    textColor: 'fg.800',
  },
  _hover: {
    backgroundColor: 'fg.200',
  },
};

const safelyParseResult = (result: any) => {
  try {
    return parseResult(result);
  } catch (e) {
    return undefined;
  }
};

export function FunctionOutput({
  getRunUrl,
  appInfoUrl,
  applet,
  currentContext,
  appSlug,
  showTabs,
  generateUserToken,
  runId,
  reloadOnClose: _reloadOnClose = false,
  zipperLocation = ZipperLocation.ZipperDotRun,
  config = {},
}: FunctionOutputProps) {
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const [reloadOnClose, setReloadOnClose] = useState(_reloadOnClose);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const modalApplet = useAppletContent();
  const modalFormContext = useForm();
  const expandedFormContext = useForm();

  // apply default values to the form if the inputs change
  // open the modal has content in the main section, open it
  useEffect(() => {
    if (modalApplet.mainContent.inputs) {
      const defaultValues: Record<string, any> = {};
      modalApplet.mainContent.inputs?.forEach(
        (i: InputParam) =>
          (defaultValues[`${i.key}:${i.type}`] = i.defaultValue),
      );
      modalFormContext.reset(defaultValues);
    }

    if (
      modalApplet.mainContent.output?.data ||
      modalApplet.mainContent.inputs
    ) {
      onOpen();
    }
  }, [modalApplet.mainContent.output?.data, modalApplet.mainContent.inputs]);

  // apply the default values in the expanded form if the inputs change
  useEffect(() => {
    if (applet.expandedContent.inputs) {
      const defaultValues: Record<string, any> = {};
      applet.expandedContent.inputs?.forEach(
        (i) => (defaultValues[`${i.key}:${i.type}`] = i.defaultValue),
      );
      expandedFormContext.reset(defaultValues);
    }
  }, [applet.expandedContent.inputs]);

  // all the logic for figuring out where to open the secondary output
  // based on the action's showAs value, the current context (main or modal),
  // and the section of the output where the action was triggered (main or expanded)
  function showSecondaryOutput({
    actionShowAs,
    inputs,
    output,
    path,
    actionSection,
  }: {
    actionShowAs: Zipper.Action['showAs'];
    inputs?: {
      inputParams: InputParams;
      defaultValues: Record<string, any>;
    };
    output?: {
      data: string;
      inputsUsed: InputParams;
    };
    path: string;
    actionSection: 'main' | 'expanded';
  }) {
    const content = {
      inputs: inputs?.inputParams,
      output,
      path,
    };

    switch (actionShowAs) {
      // show the output in the expanded section
      case 'expanded': {
        // if triggered from within the expanded section, add a new panel
        // where the main content stays the same but the expanded content is new
        if (actionSection === 'expanded') {
          applet.addPanel({
            mainContent: applet.mainContent,
            expandedContent: content,
          });
          // if triggered from the main section, just set/replace the expanded section
        } else {
          applet.expandedContent.set(content);
        }
        break;
      }
      case 'modal': {
        // if we're in the main applet, open a modal by setting the modalApplet content
        if (currentContext === 'main') {
          modalApplet.mainContent.set(content);
          break;
        }
        //if we're already in a modal, add a new panel
        applet.addPanel({
          mainContent: content,
        });
        break;
      }
      case 'refresh': {
        // refresh replaces the existing content without adding a panel
        if (actionSection === 'expanded') {
          applet.mainContent.set(applet.mainContent);
          applet.expandedContent.set({
            output: content.output,
            inputs: applet.expandedContent.inputs,
            path: applet.expandedContent.path,
          });
        } else {
          applet.mainContent.set({
            output: content.output,
            inputs: applet.mainContent.inputs,
            path: applet.mainContent.path,
          });
        }
        break;
      }
      // this covers replace_all and modal being opened from a modal
      default: {
        //replace all
        if (actionSection === 'expanded') {
          applet.addPanel({
            mainContent: applet.mainContent,
            expandedContent: content,
          });
        } else {
          applet.addPanel({
            mainContent: content,
          });
        }
      }
    }
  }

  const expandedOutputComponent = () => {
    return (
      <>
        {applet.expandedContent.inputs && (
          <Box mb="10">
            <FunctionInputs
              params={applet.expandedContent.inputs}
              formContext={expandedFormContext}
            />

            <Button
              colorScheme="purple"
              isDisabled={applet.expandedContent.isLoading}
              onClick={async () => {
                if (!applet.expandedContent.path) return;
                applet.expandedContent.setIsLoading(true);
                const values = getInputsFromFormData(
                  expandedFormContext.getValues(),
                  applet.expandedContent.inputs || [],
                );
                const inputsWithValues = applet.expandedContent.inputs?.map(
                  (i) => {
                    i.value = values[i.key];
                    return i;
                  },
                );

                const userToken = await generateUserToken();

                const headers = {
                  Authorization: `Bearer ${userToken || ''}`,
                };

                const res = await fetch(
                  getRunUrl(applet.expandedContent.path),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    headers,
                  },
                );
                const text = await res.text();

                applet.expandedContent.set({
                  output: { data: text, inputsUsed: inputsWithValues || [] },
                });
                applet.expandedContent.setIsLoading(false);
              }}
            >
              {applet.expandedContent.isLoading ? <Spinner /> : <>Run</>}
            </Button>
          </Box>
        )}
        {applet.expandedContent.output?.data && (
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <TabList {...tablistStyles} display={showTabs ? 'flex' : 'none'}>
              <Tab {...tabButtonStyles}>Results</Tab>
              <Tab {...tabButtonStyles}>Raw Output</Tab>
            </TabList>
            <TabPanels border="1px solid" borderColor="fg.200">
              <TabPanel
                p={
                  safelyParseResult(applet.expandedContent.output.data)
                    ?.type === 'html'
                    ? 0
                    : 4
                }
              >
                <Box
                  width="full"
                  data-function-output="smart"
                  whiteSpace="pre-wrap"
                >
                  <SmartFunctionOutputProvider
                    outputSection="expanded"
                    config={config}
                    location={zipperLocation}
                  >
                    <SmartFunctionOutput
                      result={applet.expandedContent.output.data}
                      level={0}
                      tableLevel={0}
                    />
                  </SmartFunctionOutputProvider>
                </Box>
              </TabPanel>
              <TabPanel backgroundColor="fg.100">
                <RawFunctionOutput
                  result={applet?.expandedContent.output?.data}
                />
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </>
    );
  };

  const modalOutputComponent = () => {
    return (
      <>
        {modalApplet.mainContent.inputs && (
          <Box>
            <FunctionInputs
              params={modalApplet.mainContent.inputs}
              formContext={modalFormContext}
            />
            <Button
              colorScheme="purple"
              isDisabled={modalApplet.mainContent.isLoading}
              onClick={async () => {
                modalApplet.mainContent.setIsLoading(true);
                const values = getInputsFromFormData(
                  modalFormContext.getValues(),
                  modalApplet.mainContent.inputs || [],
                );

                const inputsWithValues = modalApplet.mainContent.inputs?.map(
                  (i) => {
                    i.value = values[i.key];
                    return i;
                  },
                );

                const userToken = await generateUserToken();

                const headers = {
                  Authorization: `Bearer ${userToken || ''}`,
                };

                const res = await fetch(
                  getRunUrl(modalApplet.mainContent.path || 'main.ts'),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    headers,
                  },
                );
                const text = await res.text();

                modalApplet.expandedContent.set({
                  inputs: undefined,
                  output: undefined,
                });
                modalApplet.mainContent.set({
                  output: { data: text, inputsUsed: inputsWithValues || [] },
                });
                setReloadOnClose(true);
                modalApplet.mainContent.setIsLoading(false);
              }}
            >
              {modalApplet.mainContent.isLoading ? <Spinner /> : <>Run</>}
            </Button>
          </Box>
        )}

        {modalApplet.mainContent.output?.data && (
          <FunctionOutput
            applet={modalApplet}
            getRunUrl={getRunUrl}
            appInfoUrl={appInfoUrl}
            currentContext="modal"
            appSlug={appSlug}
            showTabs={showTabs}
            generateUserToken={generateUserToken}
            reloadOnClose={reloadOnClose}
            config={config}
          />
        )}
      </>
    );
  };

  async function closeModal() {
    modalApplet.reset();
    onClose();
    if (reloadOnClose) {
      const originalInputs: Zipper.Inputs = {};

      const refreshPath = applet?.mainContent.path;
      const refreshInputParams = applet?.mainContent.output?.inputsUsed || [];

      refreshInputParams.forEach((i) => (originalInputs[i.key] = i.value));

      const userToken = await generateUserToken();

      const headers = {
        Authorization: `Bearer ${userToken || ''}`,
      };

      const refreshRes = await fetch(getRunUrl(refreshPath || 'main.ts'), {
        method: 'POST',
        body: JSON.stringify(originalInputs),
        headers,
      });
      const text = await refreshRes.text();

      showSecondaryOutput({
        actionShowAs: 'refresh',
        actionSection: 'main',
        output: {
          data: text,
          inputsUsed: refreshInputParams,
        },
        path: refreshPath || 'main.ts',
      });
      setReloadOnClose(false);
    }
  }

  const [stickyTabs, setStickyTabs] = useState(false);
  useEffectOnce(() => {
    if (window.ZipperLocation === ZipperLocation.ZipperDotDev)
      setStickyTabs(true);
  });

  const parsedResult =
    safelyParseResult(applet?.mainContent.output?.data) || undefined;

  return (
    <FunctionOutputProvider
      showSecondaryOutput={showSecondaryOutput}
      getRunUrl={getRunUrl}
      appInfoUrl={appInfoUrl}
      applet={applet}
      modalApplet={modalApplet}
      currentContext={currentContext}
      appSlug={appSlug}
      generateUserToken={generateUserToken}
    >
      <ErrorBoundary
        // this makes sure we render a new boundary with a new result set
        key={applet?.mainContent.path}
        fallback={
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <TabList {...tablistStyles}>
              <Tab {...tabButtonStyles}>Raw Output</Tab>
            </TabList>
            <TabPanels p={0} style={{ marginTop: 0 }}>
              <RawFunctionOutput result={applet?.mainContent.output?.data} />
            </TabPanels>
          </Tabs>
        }
      >
        <>
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <VStack h="full" w="full" gap={0}>
              <TabList
                {...tablistStyles}
                display={showTabs ? 'flex' : 'none'}
                {...(stickyTabs ? stickyTabsStyles : undefined)}
              >
                <Tab {...tabButtonStyles}>Results</Tab>
                <Tab {...tabButtonStyles}>Raw Output</Tab>
                <Spacer />
                <Link
                  href={`${
                    process.env.NODE_ENV === 'production'
                      ? 'https://'
                      : 'http://'
                  }${getAppLink(appSlug)}/run/history/${runId?.split('-')[0]}`}
                  target="_blank"
                  p={2}
                >
                  <HiArrowTopRightOnSquare />
                </Link>
              </TabList>
              <TabPanels
                w="full"
                h="full"
                border={showTabs ? '1px solid' : 'none'}
                borderColor="fg.200"
                style={{ marginTop: 0 }}
              >
                <TabPanel
                  p={
                    parsedResult?.type === 'html' ||
                    (currentContext === 'main' &&
                      zipperLocation === ZipperLocation.ZipperDotRun)
                      ? 0
                      : 4
                  }
                  h="full"
                >
                  <Box
                    h="full"
                    overflow={
                      currentContext === 'main' &&
                      zipperLocation === ZipperLocation.ZipperDotRun
                        ? 'auto'
                        : undefined
                    }
                  >
                    {applet.showGoBackLink() && (
                      <>
                        <Button
                          variant="Link"
                          fontSize="sm"
                          color="fg.600"
                          pl="0"
                          onClick={() => applet.goBack()}
                        >
                          <Icon as={HiChevronLeft} />
                          Back
                        </Button>
                        <Divider />
                      </>
                    )}
                    <Box
                      width="full"
                      height="full"
                      data-function-output="smart"
                      whiteSpace="pre-wrap"
                    >
                      <SmartFunctionOutputProvider
                        config={config}
                        outputSection="main"
                        location={zipperLocation}
                      >
                        <SmartFunctionOutput
                          parsedResult={parsedResult}
                          result={applet?.mainContent.output?.data}
                          level={0}
                          tableLevel={0}
                        />
                      </SmartFunctionOutputProvider>
                      {(applet?.expandedContent.output ||
                        applet?.expandedContent.inputs) && (
                        <Box
                          borderLeft={'5px solid'}
                          borderColor={'purple.300'}
                          mt={8}
                          pl={3}
                          mb={4}
                        >
                          <HStack align={'center'} my={2}>
                            <Heading flexGrow={1} size="sm" ml={1}>
                              Additional Results
                            </Heading>
                            <IconButton
                              aria-label="hide"
                              icon={
                                isExpandedResultOpen ? (
                                  <HiOutlineChevronUp />
                                ) : (
                                  <HiOutlineChevronDown />
                                )
                              }
                              onClick={() =>
                                setIsExpandedResultOpen(!isExpandedResultOpen)
                              }
                            />
                          </HStack>
                          {isExpandedResultOpen && (
                            <>{expandedOutputComponent()}</>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <RawFunctionOutput
                    result={applet?.mainContent.output?.data}
                  />
                </TabPanel>
              </TabPanels>
            </VStack>
          </Tabs>
          {currentContext === 'main' && (
            <Modal
              isOpen={isOpen}
              onClose={async () => {
                await closeModal();
              }}
              size="5xl"
            >
              <ModalOverlay />
              <ModalContent maxH="2xl">
                <ModalHeader>{modalApplet.mainContent.path}</ModalHeader>
                <ModalCloseButton />
                <ModalBody
                  fontSize="sm"
                  color="neutral.700"
                  flex={1}
                  display="flex"
                  flexDirection="column"
                  gap={8}
                  overflow="auto"
                >
                  <VStack align="stretch" w="full" spacing="10">
                    {modalOutputComponent()}
                  </VStack>
                </ModalBody>
                <ModalFooter justifyContent="end"></ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </>
      </ErrorBoundary>
    </FunctionOutputProvider>
  );
}
