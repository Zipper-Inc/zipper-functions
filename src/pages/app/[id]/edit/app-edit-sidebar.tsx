import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Divider,
} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import InputParamsForm from '~/components/edit-app-page/input-params-form';
import { LogLine } from '~/components/edit-app-page/log-line';

const JSONViewer = dynamic(
  async () => {
    const component = await import('~/components/json-editor');
    return component.JSONViewer;
  },
  {
    ssr: false,
  },
);

export function AppEditSidebar({
  inputParamsFormMethods,
  inputParams,
  outputValue,
  appEventsQuery,
}: any) {
  const [tabIndex, setTabIndex] = useState(0);

  useEffect(() => {
    // if there's a new output value, switch to the output tab
    if (outputValue) setTabIndex(1);
    // if there's no output and new logs, switch to logs
    if (!outputValue && appEventsQuery.data?.length) setTabIndex(2);
  }, [outputValue, appEventsQuery]);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const logs = appEventsQuery.data?.map((event: any) => event.eventPayload);

  return (
    <Tabs as="aside" index={tabIndex} onChange={handleTabsChange}>
      <TabList>
        <Tab>Inputs</Tab>
        <Tab isDisabled={!outputValue}>Results</Tab>
        <Tab isDisabled={!logs?.length}>Logs</Tab>
      </TabList>
      <TabPanels>
        <TabPanel backgroundColor="gray.100">
          <FormProvider {...inputParamsFormMethods}>
            <InputParamsForm params={inputParams} defaultValues={{}} />
          </FormProvider>
        </TabPanel>
        <TabPanel>
          <JSONViewer height="100px" value={outputValue || ''} />
        </TabPanel>
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
            {logs?.map((log: any) => (
              <LogLine log={log} />
            ))}
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
