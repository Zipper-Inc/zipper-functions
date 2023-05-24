import { Box, Heading, VStack, Button, Progress, Text } from '@chakra-ui/react';
import { useUser } from '@clerk/nextjs';
import { FunctionInputs, FunctionOutput, useAppletContent } from '@zipper/ui';
import { useEffect, useMemo } from 'react';
import getRunUrl from '~/utils/get-run-url';
import { generateAccessToken } from '~/utils/jwt-utils';
import { addParamToCode } from '~/utils/parse-code';
import { trpc } from '~/utils/trpc';
import { useEditorContext } from '../context/editor-context';
import { useRunAppContext } from '../context/run-app-context';
import { AppEditSidebarAppletConnectors } from './app-edit-sidebar-applet-connectors';

export const AppEditSidebarApplet = ({
  appSlug,
  inputValuesAtRun,
}: {
  appSlug: string;
  inputValuesAtRun: Record<string, any>;
}) => {
  const { formMethods, isRunning, results, userAuthConnectors, appInfo } =
    useRunAppContext();

  const generateAccessTokenMutation = trpc.useMutation(
    'user.generateAccessToken',
  );

  const { user } = useUser();

  const {
    currentScript,
    currentScriptLive,
    replaceCurrentScriptCode,
    inputParams,
    inputError,
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

  const output = useMemo(() => {
    return (
      <FunctionOutput
        applet={mainApplet}
        getRunUrl={(scriptName: string) => {
          return getRunUrl(appSlug, appInfo.lastDeploymentVersion, scriptName);
        }}
        appInfoUrl={`/api/app/info/${appSlug}`}
        currentContext={'main'}
        appSlug={appInfo.slug}
        generateUserToken={async () => {
          return user ? await generateAccessToken() : undefined;
        }}
        showTabs
      />
    );
  }, [mainApplet.updatedAt]);

  const handleAddInput = () => {
    if (currentScriptLive && currentScript) {
      const codeWithInputAdded = addParamToCode({
        code: currentScriptLive?.code || '',
      });
      replaceCurrentScriptCode(codeWithInputAdded);
    }
  };

  return (
    <>
      <Box
        p={4}
        backgroundColor="gray.100"
        position="relative"
        rounded="md"
        border="1px"
        borderColor="gray.200"
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

      {currentScript && mainApplet.mainContent.output?.data && (
        <Box mt={4}>{output}</Box>
      )}
    </>
  );
};

export default AppEditSidebarApplet;
