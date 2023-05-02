import {
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  ChakraProps,
  Box,
  Tab,
  Heading,
  HStack,
  IconButton,
} from '@chakra-ui/react';
import { FunctionOutputProps } from './types';
import { RawFunctionOutput } from './raw-function-output';
import { SmartFunctionOutput } from './smart-function-output';
import { ErrorBoundary } from '../error-boundary';
import FunctionOutputProvider from './function-output-context';
import { HiOutlineChevronUp, HiOutlineChevronDown } from 'react-icons/hi';
import { useState } from 'react';

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
  level = 0,
  showSecondaryOutput,
  getRunUrl,
  applet,
  currentContext,
  appSlug,
}: FunctionOutputProps) {
  const [isExpandedResultOpen, setIsExpandedResultOpen] = useState(true);
  const path = applet?.path || 'main.ts';
  if (!applet?.output) return <></>;
  return (
    <FunctionOutputProvider
      showSecondaryOutput={showSecondaryOutput}
      getRunUrl={getRunUrl}
      applet={applet}
      currentContext={currentContext}
      appSlug={appSlug}
    >
      <ErrorBoundary
        // this makes sure we render a new boundary with a new result set
        key={JSON.stringify(applet?.output[path])}
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
                <RawFunctionOutput result={applet?.output[path]} />
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
                  <SmartFunctionOutput
                    result={applet?.output[path]}
                    level={level}
                  />
                </Box>
              </Box>

              {applet?.expandedOutput && (
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
                      <Tabs
                        colorScheme="purple"
                        variant="enclosed"
                        {...tabsStyles}
                      >
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
                              <Box
                                width="max-content"
                                data-function-output="smart"
                              >
                                <SmartFunctionOutput
                                  result={applet.expandedOutput}
                                  level={0}
                                />
                              </Box>
                            </Box>
                          </TabPanel>
                          <TabPanel backgroundColor="gray.100">
                            <RawFunctionOutput result={applet?.output[path]} />
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </Box>
                  )}
                </Box>
              )}
            </TabPanel>
            <TabPanel backgroundColor="gray.100">
              <RawFunctionOutput result={applet?.output[path]} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </ErrorBoundary>
    </FunctionOutputProvider>
  );
}
