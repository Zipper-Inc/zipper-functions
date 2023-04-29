import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  VStack,
  Box,
  Text,
  Progress,
  HStack,
  Button,
  Tooltip,
  useToast,
  IconButton,
  Heading,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useDisclosure,
  useClipboard,
} from '@chakra-ui/react';
import {
  FunctionInputs,
  FunctionOutput,
  TabButton,
  FunctionUserConnectors,
} from '@zipper/ui';
import { useEffect, useMemo, useState } from 'react';
import { useRunAppContext } from '../context/run-app-context';
import { trpc } from '~/utils/trpc';
import { useRouter } from 'next/router';
import { addParamToCode } from '~/utils/parse-code';

import { HiOutlineClipboard, HiOutlinePlay } from 'react-icons/hi2';
import { useEditorContext } from '../context/editor-context';
import getRunUrl from '~/utils/get-run-url';
import Link from 'next/link';
import { HiOutlineChevronDown, HiOutlineChevronUp } from 'react-icons/hi';
import { getAppLink } from '@zipper/utils';
import { useAppEditSidebarContext } from '~/components/context/app-edit-sidebar-context';
import { AppConsole } from './app-console';

type AppEditSidebarProps = {
  showInputForm: boolean;
  tips?: JSX.Element;
  appSlug: string;
};

// toast duration
const duration = 1500;

export const AppEditSidebar: React.FC<AppEditSidebarProps> = ({
  showInputForm = true,
  tips,
  appSlug,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const toast = useToast();

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const {
    formMethods,
    isRunning,
    setResults,
    results,
    run,
    userAuthConnectors,
    appInfo,
  } = useRunAppContext();

  const {
    currentScript,
    currentScriptLive,
    replaceCurrentScriptCode,
    inputParams,
    inputError,
    logs,
  } = useEditorContext();

  const router = useRouter();
  const context = trpc.useContext();

  const deleteConnectorUserAuth = trpc.useMutation(
    'slackConnector.deleteUserAuth',
    {
      onSuccess: () => {
        context.invalidateQueries([
          'app.byResourceOwnerAndAppSlugs',
          {
            appSlug: router.query['app-slug'] as string,
            resourceOwnerSlug: router.query['resource-owner'] as string,
          },
        ]);
        toast({
          title: 'Slack user auth revoked.',
          status: 'success',
          duration,
          isClosable: true,
        });
      },
    },
  );
  const deleteGithubConnectorUserAuth = trpc.useMutation(
    'githubConnector.deleteUserAuth',
    {
      onSuccess: () => {
        context.invalidateQueries([
          'app.byResourceOwnerAndAppSlugs',
          {
            appSlug: router.query['app-slug'] as string,
            resourceOwnerSlug: router.query['resource-owner'] as string,
          },
        ]);
        toast({
          title: 'GitHub user auth revoked.',
          status: 'success',
          duration,
          isClosable: true,
        });
      },
    },
  );

  const deleteOpenAISecret = trpc.useMutation('secret.delete', {
    onSuccess: () => {
      context.invalidateQueries([
        'app.byResourceOwnerAndAppSlugs',
        {
          appSlug: router.query['app-slug'] as string,
          resourceOwnerSlug: router.query['resource-owner'] as string,
        },
      ]);
      toast({
        title: 'OpenAI user auth revoked.',
        status: 'success',
        duration,
        isClosable: true,
      });
    },
  });

  // state to hold whether user needs to authenticate with slack
  const [slackAuthRequired, setSlackAuthRequired] = useState(false);
  // state to hold whether user needs to authenticate with github
  const [githubAuthRequired, setGitHubAuthRequired] = useState(false);

  // get the existing Slack connector data from the database
  const slackConnector = trpc.useQuery(
    ['slackConnector.get', { appId: appInfo.id }],
    {
      enabled: slackAuthRequired,
    },
  );
  // get the existing GitHub connector data from the database
  const githubConnector = trpc.useQuery(
    ['githubConnector.get', { appId: appInfo.id }],
    {
      enabled: githubAuthRequired,
    },
  );

  // get the Slack auth URL -- if required --from the backend
  // (it includes an encrypted state value that links the auth request to the app)
  const slackAuthURL = trpc.useQuery(
    [
      'slackConnector.getAuthUrl',
      {
        appId: appInfo.id,
        scopes: {
          bot: slackConnector.data?.workspaceScopes || [],
          user: slackConnector.data?.userScopes || [],
        },
        postInstallationRedirect: window.location.href,
      },
    ],
    {
      enabled: slackConnector.isFetched,
    },
  );

  // get the Github auth URL -- if required --from the backend
  // (it includes an encrypted state value that links the auth request to the app)
  const githubAuthURL = trpc.useQuery(
    [
      'githubConnector.getAuthUrl',
      {
        appId: appInfo.id,
        scopes: githubConnector.data?.userScopes || [],
        postInstallationRedirect: window.location.href,
      },
    ],
    {
      enabled: githubConnector.isFetched,
    },
  );

  useEffect(() => {
    if (userAuthConnectors.find((c) => c.type === 'slack')) {
      setSlackAuthRequired(true);
    }
    if (userAuthConnectors.find((c) => c.type === 'github')) {
      setGitHubAuthRequired(true);
    }
  }, []);

  const appLink = getAppLink(appSlug);
  const { onCopy } = useClipboard(
    `${appLink}${
      currentScript?.filename === 'main.ts'
        ? ''
        : `/${currentScript?.filename.slice(0, -3)}`
    }`,
  );

  const copyLink = async () => {
    onCopy();
    toast({
      title: 'App link copied',
      status: 'info',
      duration,
      isClosable: true,
    });
  };

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [modalResult, setModalResult] = useState({ heading: '', body: '' });
  const { expandedResult, setExpandedResult } = useAppEditSidebarContext();
  const [inputs, setInputs] = useState<Record<string, any>>({});

  const setInputsAtTimeOfRun = () => {
    const formValues = formMethods.getValues();
    const formKeys = inputParams?.map((param) => `${param.key}:${param.type}`);
    const inputs: Record<string, any> = {};
    formKeys?.map((k) => {
      const key = k.split(':')[0] as string;
      inputs[key] = formValues[k];
    });
    setInputs(inputs);
  };

  const output = useMemo(() => {
    return (
      <FunctionOutput
        result={results[currentScript?.filename || 'main.ts']}
        setExpandedResult={(result) =>
          setExpandedResult({ [currentScript?.filename || 'main.ts']: result })
        }
        setModalResult={setModalResult}
        setOverallResult={(result) =>
          setResults({ [currentScript?.filename || 'main.ts']: result })
        }
        getRunUrl={(scriptName: string) => {
          return getRunUrl(appInfo.slug, appInfo.hash, scriptName);
        }}
        path={currentScript?.filename || 'main.ts'}
        inputs={inputs}
        currentContext={'main'}
      />
    );
  }, [appInfo.slug, appInfo.hash, results, currentScript]);

  useEffect(() => {
    if (modalResult.body) {
      onOpen();
    }
  }, [modalResult]);

  function closeModal() {
    setModalResult({ heading: '', body: '' });
    onClose();
  }

  const functionOutputComponent = (
    secondaryResults: any,
    secondaryContext: 'modal' | 'expanded',
  ) => {
    return (
      <FunctionOutput
        result={secondaryResults}
        setOverallResult={(result) =>
          setResults({ [currentScript?.filename || 'main.ts']: result })
        }
        setModalResult={setModalResult}
        setExpandedResult={(result) =>
          setExpandedResult({ [currentScript?.filename || 'main.ts']: result })
        }
        getRunUrl={(scriptName: string) => {
          return getRunUrl(appSlug, undefined, scriptName);
        }}
        inputs={inputs}
        path={currentScript?.filename || 'main.ts'}
        currentContext={secondaryContext}
      />
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

  const isLibrary = !inputParams && !inputError;
  const isHandler = inputParams || inputError;

  return (
    <VStack align="stretch">
      {isHandler && (
        <HStack w="full" mb="2">
          <HStack
            color="purple.700"
            px={4}
            py={2}
            rounded="lg"
            justifyContent="space-between"
            overflow="auto"
            border="1px"
            borderColor="gray.200"
            w="full"
          >
            <Text
              fontWeight="semibold"
              fontSize="xs"
              whiteSpace="nowrap"
              flex={1}
            >
              <Link
                href={`${
                  process.env.NODE_ENV === 'development' ? 'http' : 'https'
                }://${appLink}`}
                target="_blank"
              >
                {currentScript?.filename === 'main.ts' ? (
                  <>{appLink}</>
                ) : (
                  <>{`${appLink}/${currentScript?.filename.slice(0, -3)}`}</>
                )}
              </Link>
            </Text>
            <Tooltip label="Copy" bgColor="purple.500" textColor="gray.100">
              <IconButton
                aria-label="copy"
                colorScheme="purple"
                variant="ghost"
                size="xs"
                onClick={copyLink}
              >
                <HiOutlineClipboard />
              </IconButton>
            </Tooltip>
          </HStack>
          <Tooltip label={inputError}>
            <span>
              <Button
                colorScheme="purple"
                variant={
                  currentScript?.filename === 'main.ts' ? 'solid' : 'ghost'
                }
                onClick={() => {
                  setExpandedResult({});
                  setInputsAtTimeOfRun();
                  run(true);
                }}
                display="flex"
                gap={2}
                fontWeight="medium"
                isDisabled={isRunning || !inputParams}
              >
                <HiOutlinePlay />
                <Text>{`Run${
                  currentScript?.filename !== 'main.ts' ? ' this file' : ''
                }`}</Text>
              </Button>
            </span>
          </Tooltip>
        </HStack>
      )}

      {isLibrary && (
        <Box
          p={4}
          backgroundColor="gray.100"
          position="relative"
          rounded="md"
          border="1px"
          borderColor="gray.200"
        >
          <Heading size="sm" mb="4">
            Library file
          </Heading>

          <Text mb={4}>
            This file isn't runnable and won't be mapped to a route because it
            doesn't export a handler function. You can use it to encapsulate
            reusable functionality or to better organize your code.
          </Text>
        </Box>
      )}

      <Tabs
        colorScheme="purple"
        index={tabIndex}
        onChange={handleTabsChange}
        flex={1}
        display="flex"
        flexDirection="column"
        gap={5}
        alignItems="stretch"
        hidden={isLibrary}
      >
        <TabList
          border="none"
          borderBottom="1px solid"
          borderColor={'gray.100'}
          color="gray.500"
          gap={4}
          justifyContent="space-between"
          overflow="auto"
          pb={4}
        >
          <HStack spacing={2}>
            {showInputForm && <TabButton title="Preview" />}
            {tips && <TabButton title="Tips" />}
            <TabButton title="Console" />
          </HStack>
        </TabList>
        <TabPanels as={VStack} alignItems="stretch" flex={1} spacing="0">
          {/* INPUT */}
          {showInputForm && (
            <TabPanel
              p={0}
              flex={1}
              display="flex"
              flexDir="column"
              alignItems="stretch"
            >
              {/** @todo make this height thing less jank */}
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
                        <FunctionUserConnectors
                          userAuthConnectors={userAuthConnectors}
                          actions={{
                            github: {
                              authUrl: githubAuthURL.data?.url || '#',
                              onDelete: () => {
                                deleteGithubConnectorUserAuth.mutateAsync({
                                  appId: appInfo.id,
                                });
                              },
                            },
                            slack: {
                              authUrl: slackAuthURL.data?.url || '#',
                              onDelete: () => {
                                deleteConnectorUserAuth.mutateAsync({
                                  appId: appInfo.id,
                                });
                              },
                            },
                            openai: {
                              authUrl: '#',
                              onDelete: () => {
                                deleteOpenAISecret.mutateAsync({
                                  appId: appInfo.id,
                                  key: 'OPENAI_API_KEY',
                                });
                              },
                            },
                          }}
                        />
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
                                There was an error while parsing your handler
                                function.
                              </Text>
                              <Text color="red.500">{inputError}</Text>
                            </VStack>
                          ) : (
                            <Text>
                              Add an object parameter to your handler function
                              if your applet has inputs. The properties of the
                              parameter will be used to generate a form to
                              collect information from users.
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
                      onClick={() =>
                        setIsExpandedResultOpen(!isExpandedResultOpen)
                      }
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
                    {modalResult.heading || appInfo.name}
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
                    {functionOutputComponent(modalResult.body, 'modal')}
                  </ModalBody>
                  <ModalFooter justifyContent="space-between">
                    <Button
                      variant="outline"
                      onClick={closeModal}
                      mr="3"
                      flex={1}
                      fontWeight="medium"
                    >
                      Close
                    </Button>
                  </ModalFooter>
                </ModalContent>
              </Modal>
            </TabPanel>
          )}

          {/* TIPS */}
          {tips && <TabPanel flex={1}>{tips}</TabPanel>}

          {/* LOGS */}
          <TabPanel flex={1} p={0} mt={0}>
            <AppConsole logs={logs} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  );
};
