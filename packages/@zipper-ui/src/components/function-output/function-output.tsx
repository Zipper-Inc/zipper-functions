import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  ChakraProps,
  Box,
} from '@chakra-ui/react';
import { FunctionOutputProps } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import { TabButton } from '../tab-button';
import FunctionOutputProvider from './function-output-context';

const tabsStyles: ChakraProps = { display: 'flex', flexDir: 'column', gap: 5 };
const tablistStyles: ChakraProps = {
  gap: 2,
  border: 'none',
  color: 'gray.500',
  p: 1,
};

export function FunctionOutput({
  result,
  level = 0,
  setExpandedResult,
  setModalResult,
  setOverallResult,
  getRunUrl,
}: FunctionOutputProps) {
  return (
    <FunctionOutputProvider
      setExpandedResult={setExpandedResult}
      setModalResult={setModalResult}
      setOverallResult={setOverallResult}
      getRunUrl={getRunUrl}
    >
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
              <Box overflow="auto">
                <Box width="max-content">
                  <SmartFunctionOutput result={result} level={level} />
                </Box>
              </Box>
            </TabPanel>
            <TabPanel backgroundColor="gray.100">
              <RawFunctionOutput result={result} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ErrorBoundary>
    </FunctionOutputProvider>
  );
}
