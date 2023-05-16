import {
  ChakraProps,
  Box,
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
  Heading,
} from '@chakra-ui/react';
import { FunctionOutputProps } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import FunctionOutputProvider from './function-output-context';
import { HiChevronLeft } from 'react-icons/hi';
import { useEffect, useState } from 'react';
import { getInputsFromFormData } from '@zipper/utils';
import { FunctionInputs } from '../function-inputs';
import { useForm } from 'react-hook-form';
import {
  AppletContentReturnType,
  InputParam,
  InputParams,
} from '@zipper/types';
import { useAppletContent } from '../../hooks/use-applet-content';
import SmartFunctionOutputProvider from './smart-function-output-context';

const boxStyles: ChakraProps = { display: 'flex', flexDir: 'column', gap: 0 };

export function FunctionOutput({
  level = 0,
  getRunUrl,
  appInfoUrl,
  applet,
  currentContext,
  appSlug,
  handlerConfigs,
}: FunctionOutputProps) {
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
          applet.expandedContent.set(content);
        } else {
          applet.mainContent.set(content);
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
                const res = await fetch(
                  getRunUrl(applet.expandedContent.path),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    credentials: 'include',
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
          <Box {...boxStyles}>
            <Box
              overflow="auto"
              p="4"
              border="1px solid"
              borderColor="gray.200"
              borderRadius={'md'}
            >
              <Box width="max-content" data-function-output="smart">
                <SmartFunctionOutputProvider outputSection="expanded">
                  <SmartFunctionOutput
                    result={applet.expandedContent.output.data}
                    level={0}
                  />
                </SmartFunctionOutputProvider>
              </Box>
            </Box>
          </Box>
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
                modalApplet.mainContent.set({
                  output: { data: text, inputsUsed: inputsWithValues || [] },
                });
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
            handlerConfigs={handlerConfigs}
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
      appInfoUrl={appInfoUrl}
      applet={applet}
      modalApplet={modalApplet}
      currentContext={currentContext}
      appSlug={appSlug}
    >
      <ErrorBoundary
        // this makes sure we render a new boundary with a new result set
        key={applet?.mainContent.path}
        fallback={
          <Box {...boxStyles}>
            <Box
              border="1px solid"
              borderColor="gray.200"
              borderRadius={'md'}
              backgroundColor="gray.100"
            >
              <RawFunctionOutput result={applet?.mainContent.output?.data} />
            </Box>
          </Box>
        }
      >
        <>
          <Box {...boxStyles}>
            <Box
              overflow="auto"
              border="1px solid"
              borderColor="gray.200"
              borderRadius={'md'}
              p="4"
            >
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
                <SmartFunctionOutputProvider outputSection="main">
                  <SmartFunctionOutput
                    result={applet?.mainContent.output?.data}
                    level={level}
                  />
                </SmartFunctionOutputProvider>
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
                {expandedOutputComponent()}
              </Box>
            )}
          </Box>
          {currentContext === 'main' && (
            <Modal isOpen={isOpen} onClose={closeModal} size="5xl">
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
