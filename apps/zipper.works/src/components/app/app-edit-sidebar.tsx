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
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FunctionInputs, FunctionOutput } from '@zipper/ui';
import { LogLine } from '~/components/app/log-line';
import { useRunAppContext } from '../context/run-app-context';
import { TabButton } from './tab-button';
import { HiOutlinePlay } from 'react-icons/hi2';
import { HiChevronDown } from 'react-icons/hi';

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
    run,
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
      <TabList
        border="none"
        color="gray.500"
        gap={4}
        justifyContent="space-between"
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
            <HiChevronDown />
          </Button>
        </HStack>
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
