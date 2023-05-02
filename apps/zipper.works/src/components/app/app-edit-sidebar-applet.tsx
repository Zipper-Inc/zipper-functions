import {
  Box,
  Heading,
  VStack,
  Button,
  Progress,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import { InputParams } from '@zipper/types';
import { FunctionInputs, FunctionOutput } from '@zipper/ui';
import { getInputsFromFormData } from '@zipper/utils';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useApplet } from '~/hooks/use-applet';
import getRunUrl from '~/utils/get-run-url';
import { addParamToCode } from '~/utils/parse-code';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { AppEditSidebarAppletConnectors } from './app-edit-sidebar-applet-connectors';

export const AppEditSidebarApplet = ({ appSlug }: { appSlug: string }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    lastRunVersion,
    formMethods,
    isRunning,
    results,
    userAuthConnectors,
    appInfo,
  } = useRunAppContext();

  const {
    currentScript,
    currentScriptLive,
    replaceCurrentScriptCode,
    inputParams,
    inputError,
  } = useEditorContext();

  const modalApplet = useApplet();
  const mainApplet = useApplet();

  const modalFormContext = useForm();

  useEffect(() => {
    const defaultValues: Record<string, any> = {};
    modalApplet.inputs?.forEach((i) => (defaultValues[i.key] = i.defaultValue));
    modalFormContext.reset(defaultValues);
  }, []);

  useEffect(() => {
    if (modalApplet.output || modalApplet.inputs) {
      onOpen();
    }
  }, [modalApplet.output, modalApplet.inputs]);

  useEffect(() => {
    const output: Record<string, any> = {};
    Object.keys(results).map((k) => (output[k] = JSON.parse(results[k] || '')));
    mainApplet.setOutput(output);
  }, [results]);

  useEffect(() => {
    mainApplet.setInputs(inputParams);
  }, [inputParams]);

  function closeModal() {
    modalApplet.setOutput(undefined);
    modalApplet.setInputs(undefined);
    onClose();
  }

  useEffect(() => {
    const defaultValues: Record<string, any> = {};
    modalApplet.inputs?.forEach((i) => (defaultValues[i.key] = i.defaultValue));
    modalFormContext.reset(defaultValues);
  }, [modalApplet.inputs]);

  const isHandler = inputParams || inputError;

  const output = useMemo(() => {
    mainApplet.setPath(currentScript?.filename || 'main.ts');
    return (
      <FunctionOutput
        applet={mainApplet}
        showSecondaryOutput={showActionOutput}
        getRunUrl={(scriptName: string) => {
          return getRunUrl(appSlug, lastRunVersion, scriptName);
        }}
        currentContext={'main'}
        appSlug={appInfo.slug}
      />
    );
  }, [mainApplet.output, currentScript]);

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
            showSecondaryOutput={showActionOutput}
            getRunUrl={(scriptName: string) => {
              return getRunUrl(appSlug, undefined, scriptName);
            }}
            currentContext="modal"
            appSlug={appInfo.slug}
          />
        )}
      </>
    );
  };

  const handleAddInput = () => {
    if (currentScriptLive && currentScript) {
      const codeWithInputAdded = addParamToCode({
        code: currentScriptLive?.code || '',
      });
      replaceCurrentScriptCode(codeWithInputAdded);
    }
  };

  function showActionOutput({
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
    if (output?.result) {
      if (currentContext === 'main') {
        if (actionShowAs === 'expanded') {
          mainApplet.setExpandedOutput({
            ...mainApplet.expandedOutput,
            [currentScript?.filename || 'main.ts']: output.result,
          });
        }
        if (actionShowAs === 'modal')
          modalApplet.setOutput({
            ...modalApplet.output,
            [currentScript?.filename || 'main.ts']: output.result,
          });
        if (actionShowAs === 'refresh' || actionShowAs === 'replace_all') {
          mainApplet.setOutput({
            ...mainApplet.output,
            [currentScript?.filename || 'main.ts']: output.result,
          });
          mainApplet.setExpandedOutput({
            ...mainApplet.expandedOutput,
            [currentScript?.filename || 'main.ts']: '',
          });
        }
      }

      if (currentContext === 'modal') {
        if (actionShowAs === 'expanded') {
          modalApplet.setExpandedOutput({
            ...modalApplet.expandedOutput,
            [currentScript?.filename || 'main.ts']: output.result,
          });
        } else {
          modalApplet.setOutput({
            ...modalApplet.setOutput,
            [currentScript?.filename || 'main.ts']: output.result,
          });
          modalApplet.setExpandedOutput({
            ...modalApplet.expandedOutput,
            [currentScript?.filename || 'main.ts']: '',
          });
        }
      }

      if (currentContext === 'expanded') {
        if (actionShowAs === 'modal') {
          modalApplet.setOutput({
            ...modalApplet.setOutput,
            [currentScript?.filename || 'main.ts']: output.result,
          });
        } else {
          mainApplet.setExpandedOutput({
            ...mainApplet.expandedOutput,
            [currentScript?.filename || 'main.ts']: output.result,
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

  return (
    <>
      <Box
        p={4}
        backgroundColor="gray.100"
        position="relative"
        rounded="md"
        border="1px"
        borderColor="gray.200"
      >
        <>
          {mainApplet.inputs?.length || userAuthConnectors?.length ? (
            <>
              <Heading size="sm" mb="2">
                Inputs
              </Heading>
              {userAuthConnectors.length > 0 && (
                <AppEditSidebarAppletConnectors />
              )}
              {mainApplet.inputs && (
                <FunctionInputs
                  params={mainApplet.inputs}
                  formContext={formMethods}
                />
              )}
            </>
          ) : (
            <>
              {isHandler && (
                <>
                  <Heading size="sm" mb="4">
                    Inputs
                  </Heading>
                  {inputError ? (
                    <VStack align="start">
                      <Text>
                        There was an error while parsing your handler function.
                      </Text>
                      <Text color="red.500">{inputError}</Text>
                    </VStack>
                  ) : (
                    <Text>
                      Add an object parameter to your handler function if your
                      applet has inputs. The properties of the parameter will be
                      used to generate a form to collect information from users.
                    </Text>
                  )}
                  {!inputError && appInfo.canUserEdit && (
                    <Button
                      color={'gray.700'}
                      bg="white"
                      mt={6}
                      variant="outline"
                      fontWeight="500"
                      onClick={handleAddInput}
                    >
                      Add an input
                    </Button>
                  )}
                </>
              )}
            </>
          )}{' '}
        </>
        {isRunning && (
          <Progress
            colorScheme="purple"
            size="xs"
            isIndeterminate
            width="full"
            position="absolute"
            left={0}
            right={0}
            bottom={0}
          />
        )}
      </Box>

      {currentScript && mainApplet.output && <Box mt={4}>{output}</Box>}

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
                const res = await fetch(
                  getRunUrl(
                    appInfo.slug,
                    appInfo.lastDeploymentVersion,
                    modalApplet.path,
                  ),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    credentials: 'include',
                  },
                );
                const text = await res.text();

                modalApplet.setExpandedOutput({});
                modalApplet.setOutput({
                  [currentScript?.filename || 'main.ts']: text,
                });
              }}
            >
              Run
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default AppEditSidebarApplet;
