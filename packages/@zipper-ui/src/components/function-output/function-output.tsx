import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  ChakraProps,
  Box,
  Tab,
  Heading,
  HStack,
  IconButton,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  VStack,
  Spinner,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FunctionOutputProps } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import FunctionOutputProvider from './function-output-context';
import {
  HiOutlineChevronUp,
  HiOutlineChevronDown,
  HiChevronLeft,
} from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { getInputsFromFormData } from '@zipper/utils';
import { FunctionInputs } from '../function-inputs';
import { useForm } from 'react-hook-form';
import { useAppletContent } from '@zipper/ui';
import { InputParam, InputParams } from '@zipper/types';

const tabsStyles: ChakraProps = { display: 'flex', flexDir: 'column', gap: 0 };
const tablistStyles: ChakraProps = {
  gap: 1,
  border: '1px',
  color: 'gray.500',
  bg: 'gray.100',
  borderColor: 'gray.200',
  p: 2,
  w: 'full',
  borderTopRadius: 'md',
};
const tabButtonStyles: ChakraProps = {
  rounded: 'lg',
  py: 1,
  px: 2,
  _selected: {
    fontWeight: 'bold',
    textColor: 'gray.800',
  },
  _hover: {
    backgroundColor: 'gray.200',
  },
};

export function FunctionOutput({
  level = 0,
  getRunUrl,
  applet,
  currentContext,
  appSlug,
}: FunctionOutputProps) {
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const modalApplet = useAppletContent();
  const modalFormContext = useForm();
  const expandedFormContext = useForm();

  useEffect(() => {
    console.log(currentContext, applet.previousPanels);
  }, [applet.previousPanels]);

  useEffect(() => {
    if (modalApplet.mainContent.inputs) {
      const defaultValues: Record<string, any> = {};
      modalApplet.mainContent.inputs?.forEach(
        (i: InputParam) =>
          (defaultValues[`${i.key}:${i.type}`] = i.defaultValue),
      );
      modalFormContext.reset(defaultValues);
    }

    if (modalApplet.mainContent.output || modalApplet.mainContent.inputs) {
      onOpen();
    }
  }, [modalApplet.mainContent.output, modalApplet.mainContent.inputs]);

  useEffect(() => {
    if (applet.expandedContent.inputs) {
      const defaultValues: Record<string, any> = {};
      applet.expandedContent.inputs?.forEach(
        (i) => (defaultValues[`${i.key}:${i.type}`] = i.defaultValue),
      );
      expandedFormContext.reset(defaultValues);
    }
  }, [applet.expandedContent.output, applet.expandedContent.inputs]);

  function showSecondaryOutput({
    actionShowAs,
    inputs,
    output,
    path,
  }: {
    actionShowAs: Zipper.Action['showAs'];
    inputs?: {
      inputParams: InputParams;
      defaultValues: Record<string, any>;
    };
    output?: {
      result: string;
    };
    path: string;
  }) {
    const content = {
      inputs: inputs?.inputParams,
      output: output?.result,
      path,
    };
    if (currentContext === 'main') {
      switch (actionShowAs) {
        case 'expanded': {
          if (applet.expandedContent.output) {
            applet.addPanel({
              mainContent: applet.mainContent,
              expandedContent: content,
            });
          } else {
            applet.expandedContent.set(content);
          }
          break;
        }
        case 'modal': {
          modalApplet.mainContent.set(content);
          break;
        }
        default: {
          applet.addPanel({
            mainContent: content,
          });
        }
      }
    } else {
      switch (actionShowAs) {
        case 'expanded': {
          if (applet.expandedContent.output) {
            applet.addPanel({
              mainContent: applet.mainContent,
              expandedContent: content,
            });
          } else {
            applet.expandedContent.set(content);
          }
          break;
        }
        default: {
          applet.addPanel({ mainContent: content });
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
                const res = await fetch(
                  getRunUrl(applet.expandedContent.path),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    credentials: 'include',
                  },
                );
                const text = await res.text();

                applet.expandedContent.set({ output: text });
                applet.expandedContent.setIsLoading(false);
              }}
            >
              {applet.expandedContent.isLoading ? <Spinner /> : <>Run</>}
            </Button>
          </Box>
        )}
        {applet.expandedContent.output && (
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <TabList {...tablistStyles}>
              <Tab {...tabButtonStyles}>Results</Tab>
              <Tab {...tabButtonStyles}>Raw Output</Tab>
            </TabList>
            <TabPanels
              border="1px solid"
              borderColor="gray.200"
              borderBottomRadius={'md'}
            >
              <TabPanel>
                <Box overflow="auto">
                  <Box width="max-content" data-function-output="smart">
                    <SmartFunctionOutput
                      result={applet.expandedContent.output}
                      level={0}
                    />
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel backgroundColor="gray.100">
                <RawFunctionOutput result={applet?.mainContent.output} />
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
                const res = await fetch(
                  getRunUrl(modalApplet.mainContent.path || 'main.ts'),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    credentials: 'include',
                  },
                );
                const text = await res.text();

                modalApplet.expandedContent.set({
                  inputs: undefined,
                  output: undefined,
                });
                modalApplet.mainContent.set({ output: text });
                modalApplet.mainContent.setIsLoading(false);
              }}
            >
              {modalApplet.mainContent.isLoading ? <Spinner /> : <>Run</>}
            </Button>
          </Box>
        )}

        {modalApplet.mainContent.output && (
          <FunctionOutput
            applet={modalApplet}
            getRunUrl={getRunUrl}
            currentContext="modal"
            appSlug={appSlug}
          />
        )}
      </>
    );
  };

  function closeModal() {
    modalApplet.reset();
    onClose();
  }

  return (
    <FunctionOutputProvider
      showSecondaryOutput={showSecondaryOutput}
      getRunUrl={getRunUrl}
      applet={applet}
      modalApplet={modalApplet}
      currentContext={currentContext}
      appSlug={appSlug}
    >
      <ErrorBoundary
        // this makes sure we render a new boundary with a new result set
        key={applet?.mainContent.output}
        fallback={
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <TabList {...tablistStyles}>
              <Tab {...tabButtonStyles}>Raw Output</Tab>
            </TabList>
            <TabPanels
              border="1px solid"
              borderColor="gray.200"
              borderBottomRadius={'md'}
            >
              <TabPanel backgroundColor="gray.100">
                <RawFunctionOutput result={applet?.mainContent.output} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        }
      >
        <>
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <TabList {...tablistStyles}>
              <Tab {...tabButtonStyles}>Results</Tab>
              <Tab {...tabButtonStyles}>Raw Output</Tab>
            </TabList>
            <TabPanels
              border="1px solid"
              borderColor="gray.200"
              borderBottomRadius={'md'}
            >
              <TabPanel>
                <Box overflow="auto">
                  {applet.showGoBackLink() && (
                    <>
                      <Button
                        variant="Link"
                        fontSize="sm"
                        color="gray.600"
                        pl="0"
                        onClick={() => applet.goBack()}
                      >
                        <Icon as={HiChevronLeft} />
                        Back
                      </Button>
                      <Divider />
                    </>
                  )}
                  <Box width="max-content" data-function-output="smart">
                    <SmartFunctionOutput
                      result={applet?.mainContent.output}
                      level={level}
                    />
                  </Box>
                </Box>

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
                    {isExpandedResultOpen && <>{expandedOutputComponent()}</>}
                  </Box>
                )}
              </TabPanel>
              <TabPanel backgroundColor="gray.100">
                <RawFunctionOutput result={applet?.mainContent.output} />
              </TabPanel>
            </TabPanels>
          </Tabs>
          {currentContext === 'main' && (
            <Modal isOpen={isOpen} onClose={closeModal} size="5xl">
              <ModalOverlay />
              <ModalContent maxH="2xl">
                <ModalHeader>
                  HEADING
                  {/* {modalResult.heading || modalInputs.path || appInfo.name} */}
                </ModalHeader>
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
