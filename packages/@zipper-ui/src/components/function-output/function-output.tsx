import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  ChakraProps,
} from '@chakra-ui/react';
import { Props } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import { TabButton } from '../tab-button';

const tabsStyles: ChakraProps = { display: 'flex', flexDir: 'column', gap: 5 };
const tablistStyles: ChakraProps = {
  gap: 2,
  border: 'none',
  color: 'gray.500',
};

export function FunctionOutput({ result, level = 0 }: Props) {
  return (
    <ErrorBoundary
      // this makes sure we render a new boundary with a new result set
      key={JSON.stringify(result)}
      fallback={
        <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
          <TabList {...tablistStyles}>
            <TabButton title="Raw Output" />
          </TabList>
          <TabPanels
            border="1px solid"
            borderColor="gray.200"
            borderBottomRadius={'md'}
          >
            <TabPanel backgroundColor="gray.100">
              <RawFunctionOutput result={result} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      }
    >
      <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
        <TabList {...tablistStyles}>
          <TabButton title="Result" />
          <TabButton title="Raw Output" />
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
    </ErrorBoundary>
  );
}
