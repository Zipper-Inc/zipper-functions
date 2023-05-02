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
  const expandedFormContext = useForm();

  useEffect(() => {
    if (modalApplet.inputs) {
      const defaultValues: Record<string, any> = {};
      modalApplet.inputs?.forEach(
        (i) => (defaultValues[`${i.key}:${i.type}`] = i.defaultValue),
      );
      modalFormContext.reset(defaultValues);
    }

    if (modalApplet.output || modalApplet.inputs) {
      onOpen();
    }
  }, [modalApplet.output, modalApplet.inputs]);

  useEffect(() => {
    if (applet.expandedInputs) {
      const defaultValues: Record<string, any> = {};
      applet.expandedInputs?.forEach(
        (i) => (defaultValues[`${i.key}:${i.type}`] = i.defaultValue),
      );
      expandedFormContext.reset(defaultValues);
    }
  }, [applet.expandedInputs, applet.expandedOutput]);

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
    if (currentContext === 'main') {
      switch (actionShowAs) {
        case 'expanded': {
          applet.setExpandedInputs(inputs?.inputParams);
          applet.setExpandedOutput(output?.result);
          applet.setExpandedPath(path);
          break;
        }
        case 'modal': {
          modalApplet.setInputs(inputs?.inputParams);
          modalApplet.setOutput(output?.result);
          modalApplet.setPath(path);
          break;
        }
        default: {
          applet.addPanel(path);
          applet.setOutput(output?.result);
          applet.setInputs(inputs?.inputParams);
        }
      }
    } else {
      switch (actionShowAs) {
        case 'expanded': {
          applet.setExpandedInputs(inputs?.inputParams);
          applet.setExpandedOutput(output?.result);
          applet.setExpandedPath(path);
          break;
        }
        case 'modal': {
          applet.addPanel(path);
          applet.setInputs(inputs?.inputParams);
          applet.setOutput(output?.result);
          break;
        }
        default: {
          applet.addPanel(path);
          applet.setInputs(inputs?.inputParams);
          applet.setOutput(output?.result);
        }
      }
    }
  }

  const expandedOutputComponent = () => {
    return (
      <>
        {applet.expandedInputs && (
          <Box mb="10">
            <FunctionInputs
              params={applet.expandedInputs}
              formContext={expandedFormContext}
            />

            <Button
              colorScheme="purple"
              isDisabled={applet.isExpandedLoading}
              onClick={async () => {
                if (!applet.expandedPath) return;
                applet.setIsExpandedLoading(true);
                const values = getInputsFromFormData(
                  expandedFormContext.getValues(),
                  applet.expandedInputs || [],
                );
                const res = await fetch(getRunUrl(applet.expandedPath), {
                  method: 'POST',
                  body: JSON.stringify(values),
                  credentials: 'include',
                });
                const text = await res.text();

                applet.setExpandedOutput(text);
                applet.setIsExpandedLoading(false);
              }}
            >
              {applet.isExpandedLoading ? <Spinner /> : <>Run</>}
            </Button>
          </Box>
        )}
        {applet.expandedOutput && (
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
                      result={applet.expandedOutput}
                      level={0}
                    />
                  </Box>
                </Box>
              </TabPanel>
              <TabPanel backgroundColor="gray.100">
                <RawFunctionOutput result={applet?.output} />
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
        {modalApplet.inputs && (
          <Box>
            <FunctionInputs
              params={modalApplet.inputs}
              formContext={modalFormContext}
            />
            <Button
              colorScheme="purple"
              isDisabled={modalApplet.isLoading}
              onClick={async () => {
                modalApplet.setIsLoading(true);
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

                modalApplet.setExpandedOutput(undefined);
                modalApplet.setOutput(text);
                modalApplet.setIsLoading(false);
              }}
            >
              {modalApplet.isLoading ? <Spinner /> : <>Run</>}
            </Button>
          </Box>
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
    modalApplet.reset();
    onClose();
  }
  if (!applet?.output || !applet?.inputs) return <></>;

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
        key={applet?.output}
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
                <RawFunctionOutput result={applet?.output} />
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
                      result={applet?.output}
                      level={level}
                    />
                  </Box>
                </Box>

                {(applet?.expandedOutput || applet?.expandedInputs) && (
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
                    {isExpandedResultOpen && <>{expandedOutputComponent()}</>}
                  </Box>
                )}
              </TabPanel>
              <TabPanel backgroundColor="gray.100">
                <RawFunctionOutput result={applet?.output} />
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
