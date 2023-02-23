import { Tab, Tabs, TabList, TabPanels, TabPanel } from '@chakra-ui/react';
import { Props } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';

export function FunctionOutput({ result, level = 0 }: Props) {
  return (
    <Tabs colorScheme="purple" variant="enclosed">
      <TabList>
        <Tab>Result</Tab>
        <Tab>Raw Output</Tab>
      </TabList>
      <TabPanels
        border="1px solid"
        borderColor="gray.200"
        borderBottomRadius={'md'}
      >
        <TabPanel>
          <SmartFunctionOutput result={result} level={level} />
        </TabPanel>
        <TabPanel backgroundColor="gray.100">
          <RawFunctionOutput result={result} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
