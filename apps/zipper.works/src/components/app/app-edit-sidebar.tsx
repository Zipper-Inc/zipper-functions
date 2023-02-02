import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Divider,
  Box,
  Input,
  HStack,
  Link,
  Text,
  Code,
  Button,
  Progress,
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';
import { HiOutlineDocumentDuplicate, HiRefresh } from 'react-icons/hi';
import { InputParamsForm } from '@zipper/ui';
import { LogLine } from '~/components/app/log-line';
import { InputParam } from '@zipper/types';

export function AppEditSidebar({
  showInputForm = true,
  inputParamsFormMethods,
  inputParams,
  inputValues,
  appEventsQuery,
  appInfo,
  tips,
  maxHeight,
}: {
  showInputForm: boolean;
  inputParamsFormMethods: UseFormReturn<FieldValues, any>;
  inputParams: InputParam[];
  inputValues: Record<string, string>;
  appEventsQuery: any;
  appInfo: { slug: string; version: string | undefined };
  tips?: JSX.Element;
  maxHeight: string;
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [urlSearchParams, setUrlSearchParams] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');
  const [iframeLoading, setIframeLoading] = useState(true);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const logs = appEventsQuery.data?.map((event: any) => event.eventPayload);

  useEffect(() => {
    setUrlSearchParams(new URLSearchParams(inputValues).toString());
  }, [inputValues]);

  useEffect(() => {
    setIframeLoading(true);
    // don't switch over on the intial load
    if (iframeUrl && appInfo.version) setTabIndex(1);
  }, [iframeUrl, appInfo.version]);

  useEffect(() => {
    setIframeUrl(
      `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${
        appInfo.slug
      }.${
        process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
      }/call?${urlSearchParams}`,
    );
  }, [appInfo, urlSearchParams]);

  useEffect(() => {
    console.log('iframe loading', iframeLoading);
  }, [iframeLoading]);

  return (
    <Tabs
      colorScheme="purple"
      as={VStack}
      index={tabIndex}
      onChange={handleTabsChange}
      height="full"
    >
      <TabList>
        {showInputForm && <Tab>Inputs</Tab>}
        {tips && <Tab>Tips</Tab>}
        <Tab>Results</Tab>
        <Tab isDisabled={!logs?.length}>Logs</Tab>
      </TabList>
      <TabPanels height="full">
        {/* INPUT */}
        {showInputForm && (
          <TabPanel backgroundColor="gray.100" p={0}>
            {/** @todo make this height thing less jank */}
            <Box
              p={4}
              maxHeight={`calc(${maxHeight} - 50px)`}
              overflowX="visible"
              overflowY="scroll"
            >
              {inputParams && inputParams.length ? (
                <InputParamsForm
                  params={inputParams || []}
                  defaultValues={{}}
                  formContext={inputParamsFormMethods}
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
            </Box>
          </TabPanel>
        )}

        {/* TIPS */}
        {tips && <TabPanel>{tips}</TabPanel>}

        {/* RESULTS */}
        <TabPanel p="0" height="full">
          <VStack align="start" height="full">
            <Box as="nav" position="relative" width="full">
              <HStack w="full" p="2" backgroundColor="gray.100">
                <Input
                  w="full"
                  size="sm"
                  borderRadius="0"
                  backgroundColor="white"
                  disabled
                  value={iframeUrl}
                />
                <Button
                  size="sm"
                  disabled={iframeLoading}
                  onClick={() => {
                    setIframeLoading(true);
                    iframeRef.current?.setAttribute('src', iframeUrl);
                  }}
                  color={iframeLoading ? 'purple' : 'inherit'}
                >
                  <HiRefresh />
                </Button>

                <Button size="sm">
                  <Link href={iframeUrl} target="_blank">
                    <HiOutlineDocumentDuplicate />
                  </Link>
                </Button>
              </HStack>
              {iframeLoading && (
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
            <iframe
              key={`${appInfo.version}-${iframeUrl}`}
              src={iframeUrl}
              ref={iframeRef}
              width="100%"
              height="100%"
              onLoad={() => {
                setIframeLoading(false);
              }}
              style={{
                margin: 0,
                flexGrow: 1,
                opacity: iframeLoading ? 0.5 : 1,
                transition: 'opacity 250ms ease-out',
              }}
            />
          </VStack>
        </TabPanel>

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
