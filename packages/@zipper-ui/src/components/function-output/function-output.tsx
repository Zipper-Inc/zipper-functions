import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  ChakraProps,
  Box,
  Tab,
} from '@chakra-ui/react';
import { FunctionOutputProps } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import FunctionOutputProvider from './function-output-context';

const tabsStyles: ChakraProps = { display: 'flex', flexDir: 'column', gap: 0 };
const tablistStyles: ChakraProps = {
  gap: 1,
  border: '1px',
  color: 'gray.500',
  bg: 'gray.100',
  borderColor: 'gray.200',
  p: 2,
  w: 'full',
  borderTopRadius: 'md',
};
const tabButtonStyles: ChakraProps = {
  rounded: 'lg',
  py: 1,
  px: 2,
  _selected: {
    fontWeight: 'bold',
    textColor: 'gray.800',
  },
  _hover: {
    backgroundColor: 'gray.200',
  },
};

export function FunctionOutput({
  result,
  level = 0,
  setExpandedResult,
  setModalResult,
  setModalInputs,
  setOverallResult,
  getRunUrl,
  inputs,
  path,
  currentContext,
}: FunctionOutputProps) {
  return (
    <FunctionOutputProvider
      setExpandedResult={setExpandedResult}
      setModalResult={setModalResult}
      setModalInputs={setModalInputs}
      setOverallResult={setOverallResult}
      getRunUrl={getRunUrl}
      inputs={inputs}
      path={path}
      currentContext={currentContext}
    >
      <ErrorBoundary
        // this makes sure we render a new boundary with a new result set
        key={JSON.stringify(result)}
        fallback={
          <Tabs colorScheme="purple" variant="enclosed" {...tabsStyles}>
            <TabList {...tablistStyles}>
              <Tab {...tabButtonStyles}>Raw Output</Tab>
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
            <Tab {...tabButtonStyles}>Results</Tab>
            <Tab {...tabButtonStyles}>Raw Output</Tab>
          </TabList>
          <TabPanels
            border="1px solid"
            borderColor="gray.200"
            borderBottomRadius={'md'}
          >
            <TabPanel>
              <Box overflow="auto">
                <Box width="max-content" data-function-output="smart">
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
