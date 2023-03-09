import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  VStack,
  Divider,
  Box,
  Text,
  Code,
  Progress,
  HStack,
  Button,
  Tooltip,
  useToast,
  IconButton,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FunctionInputs, FunctionOutput, TabButton } from '@zipper/ui';
import { LogLine } from '~/components/app/log-line';
import { useRunAppContext } from '../context/run-app-context';

import { HiOutlineClipboard, HiOutlinePlay } from 'react-icons/hi2';

type AppEditSidebarProps = {
  showInputForm: boolean;
  tips?: JSX.Element;
  appSlug: string;
};

export const AppEditSidebar: React.FC<AppEditSidebarProps> = ({
  showInputForm = true,
  tips,
  appSlug,
}) => {
  const [tabIndex, setTabIndex] = useState(0);
  const toast = useToast();

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const {
    lastRunVersion,
    appEventsQuery,
    inputParams,
    formMethods,
    isRunning,
    result,
    run,
  } = useRunAppContext();

  const logs = appEventsQuery?.data?.map((event: any) => event.eventPayload);

  useEffect(() => {
    // don't switch over on the intial load
    if (lastRunVersion) setTabIndex(0);
  }, [lastRunVersion]);

  const appLink = `${appSlug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`;
  const copyLink = async () => {
    await navigator.clipboard.writeText(appLink);
    toast({
      title: 'App link copied',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
  };

  return (
    <Tabs
      colorScheme="purple"
      index={tabIndex}
      onChange={handleTabsChange}
      flex={1}
      display="flex"
      flexDirection="column"
      gap={5}
      alignItems="stretch"
    >
      <TabList
        border="none"
        color="gray.500"
        gap={4}
        justifyContent="space-between"
        overflow="auto"
        p={1}
      >
        <HStack spacing={2}>
          {showInputForm && <TabButton title="Preview" />}
          {tips && <TabButton title="Tips" />}
          <TabButton title="Logs" isDisabled={!logs?.length} />
        </HStack>
        <HStack>
          <Button
            colorScheme="purple"
            variant="solid"
            onClick={run}
            display="flex"
            gap={2}
            fontWeight="medium"
            isDisabled={isRunning}
          >
            <HiOutlinePlay />
            <Text>Run</Text>
          </Button>
        </HStack>
      </TabList>
      <HStack
        bgColor="neutral.50"
        color="purple.700"
        p={4}
        rounded="lg"
        justifyContent="space-between"
        overflow="auto"
      >
        <Text fontWeight="semibold" fontSize="xs" whiteSpace="nowrap" flex={1}>
          {appLink}
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
      <TabPanels as={VStack} alignItems="stretch" flex={1}>
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
            <Box p={4} backgroundColor="gray.100" position="relative">
              {inputParams && inputParams.length ? (
                <FunctionInputs
                  params={inputParams || []}
                  defaultValues={{}}
                  formContext={formMethods}
                />
              ) : (
                <>
                  <Text>
                    Add parameters to your main function and they'll show up
                    here. Here's an example:
                  </Text>
                  <Code my="5">
                    {`async function main({greeting}: {greeting: string}) {
                      ...
                    }`}
                  </Code>
                </>
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

            {result && (
              <Box mt={4} flex={1}>
                <FunctionOutput result={result} />
              </Box>
            )}
          </TabPanel>
        )}

        {/* TIPS */}
        {tips && <TabPanel flex={1}>{tips}</TabPanel>}

        {/* LOGS */}
        <TabPanel flex={1}>
          <VStack
            spacing={0}
            align="start"
            fontFamily="monospace"
            fontSize={12}
            borderTop="1px"
            borderColor="gray.200"
            mt={-2}
            ml={-4}
            mr={-4}
            divider={<Divider />}
          >
            {logs?.map((log: any, i: number) => (
              <LogLine log={log} key={i} />
            ))}
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};
