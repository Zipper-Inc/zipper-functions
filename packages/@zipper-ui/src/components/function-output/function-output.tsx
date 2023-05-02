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
} from '@chakra-ui/react';
import { FunctionOutputProps } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import FunctionOutputProvider from './function-output-context';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { getInputsFromFormData } from '@zipper/utils';
import { FunctionInputs } from '../function-inputs';
import { useForm } from 'react-hook-form';
import { useApplet } from '@zipper/ui';
import { InputParams } from '@zipper/types';

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

  const modalApplet = useApplet();
  const modalFormContext = useForm();

  // useEffect(() => {
  //   const defaultValues: Record<string, any> = {};
  //   modalApplet.inputs?.forEach((i) => (defaultValues[i.key] = i.defaultValue));
  //   modalFormContext.reset(defaultValues);
  // }, []);

  useEffect(() => {
    if (modalApplet.inputs) {
      const defaultValues: Record<string, any> = {};
      modalApplet.inputs?.forEach(
        (i) => (defaultValues[i.key] = i.defaultValue),
      );
      modalFormContext.reset(defaultValues);
    }

    if (modalApplet.output || modalApplet.inputs) {
      onOpen();
    }
  }, [modalApplet.output, modalApplet.inputs]);

  function showSecondaryOutput({
    currentContext,
    actionShowAs,
    inputs,
    output,
  }: {
    currentContext: 'main' | 'modal' | 'expanded';
    actionShowAs: Zipper.Action['showAs'];
    inputs?: {
      inputParams: InputParams;
      defaultValues: Record<string, any>;
      path: string;
    };
    output?: {
      result: any;
      path: string;
    };
  }) {
    if (!applet || !modalApplet || !applet.path || !modalApplet.path) return;
    if (output?.result) {
      if (currentContext === 'main') {
        if (actionShowAs === 'expanded') {
          applet.setExpandedOutput({
            ...applet.expandedOutput,
            [applet.path]: output.result,
          });
        }
        if (actionShowAs === 'modal')
          modalApplet.setOutput({
            ...modalApplet.output,
            [modalApplet.path]: output.result,
          });
        if (actionShowAs === 'refresh' || actionShowAs === 'replace_all') {
          applet.setOutput({
            ...applet.output,
            [applet.path]: output.result,
          });
          applet.setExpandedOutput({
            ...applet.expandedOutput,
            [applet.path]: '',
          });
        }
      }

      if (currentContext === 'modal') {
        if (actionShowAs === 'expanded') {
          modalApplet.setExpandedOutput({
            ...modalApplet.expandedOutput,
            [modalApplet.path]: output.result,
          });
        } else {
          modalApplet.setOutput({
            ...modalApplet.setOutput,
            [modalApplet.path]: output.result,
          });
          modalApplet.setExpandedOutput({
            ...modalApplet.expandedOutput,
            [modalApplet.path]: '',
          });
        }
      }

      if (currentContext === 'expanded') {
        if (actionShowAs === 'modal') {
          modalApplet.setOutput({
            ...modalApplet.setOutput,
            [modalApplet.path]: output.result,
          });
        } else {
          applet.setExpandedOutput({
            ...applet.expandedOutput,
            [applet.path]: output.result,
          });
        }
      }
    }

    if (inputs) {
      if (actionShowAs === 'modal') {
        modalApplet.setInputs(inputs?.inputParams);
      }
    }
  }

  const modalOutputComponent = () => {
    return (
      <>
        {modalApplet.inputs && (
          <FunctionInputs
            params={modalApplet.inputs}
            formContext={modalFormContext}
          />
        )}

        {modalApplet.output && (
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
    modalApplet.setOutput(undefined);
    modalApplet.setInputs(undefined);
    onClose();
  }
  const path = applet?.path || 'main.ts';
  if (!applet?.output || !applet?.inputs) return <></>;
  if (
    Object.keys(applet?.output || {}).length === 0 ||
    (applet?.inputs || []).length === 0
  )
    return <></>;

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
        key={JSON.stringify(applet?.output[path])}
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
                <RawFunctionOutput result={applet?.output[path]} />
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
                  <Box width="max-content" data-function-output="smart">
                    <SmartFunctionOutput
                      result={applet?.output[path]}
                      level={level}
                    />
                  </Box>
                </Box>

                {applet?.expandedOutput && (
                  <Box
                    borderLeft={'5px solid'}
                    borderColor={'purple.300'}
                    mt={8}
                    pl={3}
                    mb={4}
                  >
                    <HStack align={'center'} mt={2}>
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
                      <Box mt={4}>
                        <Tabs
                          colorScheme="purple"
                          variant="enclosed"
                          {...tabsStyles}
                        >
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
                                <Box
                                  width="max-content"
                                  data-function-output="smart"
                                >
                                  <SmartFunctionOutput
                                    result={applet.expandedOutput}
                                    level={0}
                                  />
                                </Box>
                              </Box>
                            </TabPanel>
                            <TabPanel backgroundColor="gray.100">
                              <RawFunctionOutput
                                result={applet?.output[path]}
                              />
                            </TabPanel>
                          </TabPanels>
                        </Tabs>
                      </Box>
                    )}
                  </Box>
                )}
              </TabPanel>
              <TabPanel backgroundColor="gray.100">
                <RawFunctionOutput result={applet?.output[path]} />
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
                <ModalFooter justifyContent="end">
                  <Button
                    variant="outline"
                    onClick={closeModal}
                    mr="3"
                    fontWeight="medium"
                  >
                    Close
                  </Button>
                  <Button
                    colorScheme="purple"
                    onClick={async () => {
                      const values = getInputsFromFormData(
                        modalFormContext.getValues(),
                        modalApplet.inputs || [],
                      );
                      const res = await fetch(getRunUrl(modalApplet.path), {
                        method: 'POST',
                        body: JSON.stringify(values),
                        credentials: 'include',
                      });
                      const text = await res.text();

                      modalApplet.setExpandedOutput({});
                      modalApplet.setOutput({
                        [modalApplet.path]: text,
                      });
                    }}
                  >
                    Run
                  </Button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          )}
        </>
      </ErrorBoundary>
    </FunctionOutputProvider>
  );
}
