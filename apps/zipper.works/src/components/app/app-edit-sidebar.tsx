import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Divider,
  Box,
  Text,
  Code,
  Progress,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FunctionInputs, FunctionOutput } from '@zipper/ui';
import { LogLine } from '~/components/app/log-line';
import { useRunAppContext } from '../context/run-app-context';

export function AppEditSidebar({
  showInputForm = true,
  tips,
}: {
  showInputForm: boolean;
  tips?: JSX.Element;
}) {
  const [tabIndex, setTabIndex] = useState(0);

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
  } = useRunAppContext();

  const logs = appEventsQuery?.data?.map((event: any) => event.eventPayload);

  useEffect(() => {
    // don't switch over on the intial load
    if (lastRunVersion) setTabIndex(0);
  }, [lastRunVersion]);

  return (
    <Tabs
      colorScheme="purple"
      index={tabIndex}
      onChange={handleTabsChange}
      flex={1}
      display="flex"
      flexDirection="column"
      gap={2}
      alignItems="stretch"
    >
      <TabList>
        {showInputForm && <Tab>Preview</Tab>}
        {tips && <Tab>Tips</Tab>}
        <Tab isDisabled={!logs?.length}>Logs</Tab>
      </TabList>
      <TabPanels>
        {/* INPUT */}
        {showInputForm && (
          <TabPanel p={0}>
            <Box overflowX="visible" overflowY="scroll">
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
                <Box mt={4}>
                  <FunctionOutput result={result} />
                </Box>
              )}
            </Box>
          </TabPanel>
        )}

        {/* TIPS */}
        {tips && <TabPanel>{tips}</TabPanel>}

        {/* LOGS */}
        <TabPanel>
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
}
