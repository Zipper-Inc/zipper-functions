import {
  Box,
  Heading,
  VStack,
  Button,
  Progress,
  HStack,
  IconButton,
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
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';
import getRunUrl from '~/utils/get-run-url';
import { addParamToCode } from '~/utils/parse-code';
import { useAppEditSidebarContext } from '../context/app-edit-sidebar-context';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { AppEditSidebarAppletConnectors } from './app-edit-sidebar-applet-connectors';

export const AppEditSidebarApplet = ({ appSlug }: { appSlug: string }) => {
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalResult, setModalResult] = useState({ heading: '', body: '' });
  const [modalExpandedResult, setModalExpandedResult] = useState('');
  const { expandedResult, setExpandedResult, inputs } =
    useAppEditSidebarContext();
  const [modalInputs, setModalInputs] = useState<{
    inputParams: InputParams;
    defaultValues: Record<string, any>;
    path: string;
  }>({ inputParams: [], defaultValues: {}, path: 'main.ts' });

  const modalFormContext = useForm({
    defaultValues: modalInputs.defaultValues,
  });

  const {
    lastRunVersion,
    formMethods,
    isRunning,
    setResults,
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

  useEffect(() => {
    if (modalResult.body || modalInputs.inputParams.length) {
      onOpen();
    }
  }, [modalResult, modalInputs]);

  function closeModal() {
    setModalResult({ heading: '', body: '' });
    setModalInputs({ inputParams: [], defaultValues: {}, path: 'main.ts' });
    onClose();
  }

  useEffect(() => {
    modalFormContext.reset(modalInputs.defaultValues);
  }, [modalInputs]);

  const isHandler = inputParams || inputError;

  const output = useMemo(() => {
    return (
      <FunctionOutput
        result={results[currentScript?.filename || 'main.ts']}
        showSecondaryOutput={showActionOutput}
        getRunUrl={(scriptName: string) => {
          return getRunUrl(appSlug, lastRunVersion, scriptName);
        }}
        path={currentScript?.filename || 'main.ts'}
        inputs={inputs}
        currentContext={'main'}
        appSlug={appInfo.slug}
      />
    );
  }, [results, currentScript]);

  const functionOutputComponent = (
    secondaryResults: any,
    secondaryContext: 'modal' | 'expanded',
  ) => {
    const showOutputs =
      modalResult.body ||
      expandedResult[currentScript?.filename || 'main.ts'] ||
      modalExpandedResult;

    const showInputs =
      secondaryContext === 'modal' && !!modalInputs.inputParams;

    return (
      <>
        {showInputs && (
          <FunctionInputs
            params={modalInputs.inputParams}
            formContext={modalFormContext}
          />
        )}

        {showOutputs && (
          <FunctionOutput
            result={secondaryResults}
            showSecondaryOutput={showActionOutput}
            getRunUrl={(scriptName: string) => {
              return getRunUrl(appSlug, undefined, scriptName);
            }}
            inputs={inputs}
            path={currentScript?.filename || 'main.ts'}
            currentContext={secondaryContext}
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
          setExpandedResult({
            ...expandedResult,
            [currentScript?.filename || 'main.ts']: output.result,
          });
        }
        if (actionShowAs === 'modal') setModalResult(output.result);
        if (actionShowAs === 'refresh' || actionShowAs === 'replace_all') {
          setResults({
            ...results,
            [currentScript?.filename || 'main.ts']: output.result,
          });
          setExpandedResult({});
        }
      }

      if (currentContext === 'modal') {
        if (actionShowAs === 'expanded') {
          setModalExpandedResult(output.result);
        } else {
          setModalResult(output.result);
          setModalExpandedResult('');
        }
      }

      if (currentContext === 'expanded') {
        if (actionShowAs === 'modal') {
          setModalResult(output.result);
        } else {
          setExpandedResult({
            ...expandedResult,
            [currentScript?.filename || 'main.ts']: output.result,
          });
        }
      }
    }

    if (inputs?.inputParams) {
      if (actionShowAs === 'modal') {
        setModalInputs(inputs);
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
          {inputParams?.length || userAuthConnectors?.length ? (
            <>
              <Heading size="sm" mb="2">
                Inputs
              </Heading>
              {userAuthConnectors.length > 0 && (
                <AppEditSidebarAppletConnectors />
              )}
              {inputParams && inputParams.length > 0 && (
                <FunctionInputs
                  params={inputParams}
                  defaultValues={{}}
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

      {currentScript && results[currentScript.filename] && (
        <Box mt={4}>{output}</Box>
      )}

      {expandedResult[currentScript?.filename || 'main.ts'] && (
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
              onClick={() => setIsExpandedResultOpen(!isExpandedResultOpen)}
            />
          </HStack>
          {isExpandedResultOpen && (
            <Box mt={4}>
              {functionOutputComponent(
                expandedResult[currentScript?.filename || 'main.ts'],
                'expanded',
              )}
            </Box>
          )}
        </Box>
      )}

      <Modal isOpen={isOpen} onClose={closeModal} size="5xl">
        <ModalOverlay />
        <ModalContent maxH="2xl">
          <ModalHeader>
            {modalResult.heading || modalInputs.path || appInfo.name}
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
              {functionOutputComponent(modalResult.body, 'modal')}
              {modalExpandedResult && (
                <Box
                  borderLeft={'5px solid'}
                  borderColor={'purple.300'}
                  mt={8}
                  pl={3}
                  mb={4}
                >
                  <Heading flexGrow={1} size="sm" ml={1}>
                    Additional Results
                  </Heading>
                  <Box mt={4}>
                    {functionOutputComponent(modalExpandedResult, 'modal')}
                  </Box>
                </Box>
              )}
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
                  modalInputs.inputParams,
                );
                const res = await fetch(
                  getRunUrl(
                    appInfo.slug,
                    appInfo.lastDeploymentVersion,
                    modalInputs.path,
                  ),
                  {
                    method: 'POST',
                    body: JSON.stringify(values),
                    credentials: 'include',
                  },
                );
                const text = await res.text();

                setModalExpandedResult('');
                setModalResult({
                  heading: modalInputs.path,
                  body: text,
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
