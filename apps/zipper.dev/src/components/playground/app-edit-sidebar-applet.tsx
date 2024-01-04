import {
  Box,
  Button,
  Heading,
  HStack,
  Icon,
  ListItem,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverContent,
  PopoverHeader,
  PopoverTrigger,
  Progress,
  Text,
  Tooltip,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { ZipperLocation } from '@zipper/types';
import {
  FunctionInputs,
  FunctionOutput,
  getDescription,
  HandlerDescription,
  useAppletContent,
} from '@zipper/ui';
import { useEffect, useMemo, useState } from 'react';
import { HiExclamationCircle, HiOutlineLightBulb } from 'react-icons/hi2';
import { PiPlayBold, PiPlayDuotone } from 'react-icons/pi';
import { useUser } from '~/hooks/use-user';
import getRunUrl from '~/utils/get-run-url';
import { getAppVersionFromHash } from '~/utils/hashing';
import { addParamToCode } from '~/utils/parse-code';
import { getOrCreateScriptModel } from '~/utils/playground.utils';
import { trpc } from '~/utils/trpc';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { AppEditSidebarAppletConnectors } from './app-edit-sidebar-applet-connectors';

export const AppEditSidebarApplet = ({ appSlug }: { appSlug: string }) => {
  const [inputValuesAtRun, setInputValuesAtRun] = useState<Record<string, any>>(
    {},
  );

  const [runId, setRunId] = useState<string | undefined>(undefined);

  const {
    run,
    configs,
    formMethods,
    isRunning,
    results,
    userAuthConnectors,
    appInfo,
  } = useRunAppContext();

  const generateAccessTokenMutation =
    trpc.user.generateAccessToken.useMutation();

  const { user } = useUser();

  const {
    currentScript,
    inputParams,
    inputError,
    editorHasErrors,
    getErrorFiles,
    monacoRef,
  } = useEditorContext();

  const mainApplet = useAppletContent();

  useEffect(() => {
    mainApplet.reset();
    mainApplet.mainContent.set({ inputs: inputParams });
  }, [isRunning]);

  useEffect(() => {
    mainApplet.reset();
    const inputParamsWithValues = inputParams?.map((i) => {
      i.value = inputValuesAtRun[i.key];
      return i;
    });
    mainApplet.mainContent.set({
      inputs: inputParams,
      output: {
        data: results[currentScript?.filename || 'main.ts'] || '',
        inputsUsed: inputParamsWithValues || [],
      },
      path: currentScript?.filename || 'main.ts',
    });
  }, [results, currentScript]);

  useEffect(() => {
    mainApplet.mainContent.set({ inputs: inputParams });
  }, [inputParams]);

  const generateAccessToken = async () => {
    const result = await generateAccessTokenMutation.mutateAsync({});
    if (typeof result === 'string') {
      return result;
    }
    return undefined;
  };

  const isHandler = inputParams || inputError;

  // There are dragons here 👇
  // It's easy to break things 🙈
  const output = useMemo(() => {
    return (
      <FunctionOutput
        key={runId}
        applet={mainApplet}
        config={configs?.[currentScript?.filename || '']}
        getRunUrl={(scriptName: string) => {
          return getRunUrl(
            appSlug,
            getAppVersionFromHash(appInfo.playgroundVersionHash),
            scriptName,
          );
        }}
        bootInfoUrl={`/api/bootInfo/${appSlug}`}
        currentContext={'main'}
        appSlug={appInfo.slug}
        generateUserToken={async () => {
          return user ? await generateAccessToken() : undefined;
        }}
        showTabs
        runId={runId}
        zipperLocation={ZipperLocation.ZipperDotDev}
      />
    );
  }, [mainApplet.updatedAt]);

  const handleAddInput = () => {
    if (currentScript && monacoRef?.current) {
      const model = getOrCreateScriptModel(currentScript, monacoRef.current);
      const codeWithInputAdded = addParamToCode({
        code: model.getValue() || currentScript.code || '',
      });

      const editor = monacoRef.current.editor
        .getEditors()
        .find((e) => e.getModel() === model);

      editor?.pushUndoStop();
      model.setValue(codeWithInputAdded);
    }
  };

  const errorTooltip =
    inputError ||
    (editorHasErrors() && (
      <>
        Fix errors in the following files before running:
        <UnorderedList>
          {getErrorFiles().map((f, i) => (
            <ListItem key={`[${i}] ${f}`}>{f}</ListItem>
          ))}
        </UnorderedList>
      </>
    ));

  const setInputsAtTimeOfRun = () => {
    const formValues = formMethods.getValues();
    const formKeys = inputParams?.map((param) => `${param.key}:${param.type}`);
    const inputs: Record<string, any> = {};
    formKeys?.map((k) => {
      const key = k.split(':')[0] as string;
      inputs[key] = formValues[k];
    });

    setInputValuesAtRun(inputs);
  };

  const description = getDescription({
    config: currentScript?.filename
      ? configs?.[currentScript.filename]
      : undefined,
  });

  return (
    <>
      {description && (
        <Box mb="6">
          <HandlerDescription
            description={description}
            location={ZipperLocation.ZipperDotDev}
          />
        </Box>
      )}
      <Box
        p={4}
        backgroundColor="fg.100"
        position="relative"
        border="1px"
        borderColor="fg.200"
        w="full"
      >
        <>
          {mainApplet.mainContent.inputs?.length ||
          userAuthConnectors?.length ? (
            <>
              <Heading size="sm" mb="2">
                Inputs
              </Heading>
              {userAuthConnectors.length > 0 && (
                <AppEditSidebarAppletConnectors />
              )}
              {mainApplet.mainContent.inputs && (
                <FunctionInputs
                  params={mainApplet.mainContent.inputs}
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
                  {inputError && (
                    <HStack
                      border="1px solid"
                      p="4"
                      borderColor="red.200"
                      backgroundColor="bgColor"
                      boxShadow="sm"
                      alignItems="start"
                    >
                      <Icon as={HiExclamationCircle} color="red.500" m="2" />
                      <VStack align="start">
                        <Text>
                          There was an error while parsing your handler
                          function.
                        </Text>
                        <Text color="red.500">{inputError}</Text>
                      </VStack>
                    </HStack>
                  )}
                  {!inputError && appInfo.canUserEdit && (
                    <Popover trigger="hover" openDelay={600}>
                      <PopoverTrigger>
                        <Button
                          colorScheme="purple"
                          bg="bgColor"
                          border="1px solid"
                          borderColor="purple.100"
                          _hover={{ bg: 'purple.100' }}
                          w="full"
                          variant="ghost"
                          fontWeight="500"
                          onClick={handleAddInput}
                        >
                          Add an input
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent>
                        <PopoverHeader fontWeight="semibold">
                          <HStack>
                            <Icon as={HiOutlineLightBulb} />
                            <Text>Add an input</Text>
                          </HStack>
                        </PopoverHeader>
                        <PopoverArrow />
                        <PopoverBody>
                          Need to collect inputs from your users? Add an object
                          parameter to your handler function and we'll
                          automatically generate a form for you.
                        </PopoverBody>
                      </PopoverContent>
                    </Popover>
                  )}
                </>
              )}
            </>
          )}{' '}
        </>

        {isHandler && (
          <HStack w="full" mb="2">
            <Tooltip label={errorTooltip || inputError}>
              <span style={{ width: '100%' }}>
                <Button
                  w="full"
                  mt="4"
                  colorScheme="purple"
                  onClick={async () => {
                    setInputsAtTimeOfRun();
                    setRunId(
                      await run({
                        shouldSave: appInfo.canUserEdit,
                      }),
                    );
                  }}
                  display="flex"
                  gap={2}
                  fontWeight="medium"
                  isDisabled={isRunning || !inputParams || editorHasErrors()}
                >
                  {currentScript?.filename === 'main.ts' ? (
                    <PiPlayBold />
                  ) : (
                    <PiPlayDuotone />
                  )}
                  <Text>Run</Text>
                </Button>
              </span>
            </Tooltip>
          </HStack>
        )}

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

      {currentScript && mainApplet.mainContent.output?.data && (
        <VStack mt={4} align="stretch">
          {output}
        </VStack>
      )}
    </>
  );
};

export default AppEditSidebarApplet;
