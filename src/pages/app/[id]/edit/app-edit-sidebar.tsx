import { Tabs, TabList, Tab, TabPanels, TabPanel } from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import InputParamsForm from '~/components/edit-app-page/input-params-form';

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

  // switch to the output tab anytime the output value changes
  useEffect(() => {
    if (outputValue) setTabIndex(1);
  }, [outputValue]);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const logs =
    JSON.stringify(
      appEventsQuery.data?.map((event: any) => event.eventPayload),
      null,
      2,
    ) || '';

  return (
    <Tabs as="aside" index={tabIndex} onChange={handleTabsChange}>
      <TabList>
        <Tab>Inputs</Tab>
        <Tab isDisabled={!outputValue}>Results</Tab>
        <Tab isDisabled={!logs}>Logs</Tab>
      </TabList>
      <TabPanels>
        <TabPanel backgroundColor="gray.100">
          <FormProvider {...inputParamsFormMethods}>
            <InputParamsForm params={inputParams} defaultValues={{}} />
          </FormProvider>
        </TabPanel>
        <TabPanel>
          <JSONViewer height="100px" value={outputValue} />
        </TabPanel>
        <TabPanel>
          <JSONViewer height="100px" value={logs} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
