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
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';
import { HiOutlineDocumentDuplicate, HiRefresh } from 'react-icons/hi';
import InputParamsForm from '~/components/app/input-params-form';
import { LogLine } from '~/components/app/log-line';
import { InputParam } from '~/types/input-params';

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
  const [iframeLoadCount, setIframeLoadCount] = useState(0);

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const logs = appEventsQuery.data?.map((event: any) => event.eventPayload);

  useEffect(() => {
    setUrlSearchParams(new URLSearchParams(inputValues).toString());
  }, [inputValues]);

  useEffect(() => {
    if (iframeLoadCount > 1) {
      setTabIndex(1);
    }
  }, [iframeLoadCount]);

  useEffect(() => {
    setIframeUrl(
      `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${
        appInfo.slug
      }.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}/?${urlSearchParams}`,
    );
  }, [appInfo, urlSearchParams]);

  return (
    <Tabs
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
              <FormProvider {...inputParamsFormMethods}>
                {inputParams && inputParams.length ? (
                  <InputParamsForm
                    params={inputParams || []}
                    defaultValues={{}}
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
              </FormProvider>
            </Box>
          </TabPanel>
        )}

        {/* TIPS */}
        {tips && <TabPanel>{tips}</TabPanel>}

        {/* RESULTS */}
        <TabPanel p="0" height="full">
          <VStack align="start" height="full">
            <HStack w="full" p="2" backgroundColor="gray.100">
              <Input
                w="full"
                size="sm"
                borderRadius="0"
                backgroundColor="white"
                disabled
                value={iframeUrl}
              />
              <Link
                onClick={() => {
                  iframeRef.current?.setAttribute('src', iframeUrl);
                }}
              >
                <HiRefresh />
              </Link>

              <Link href={iframeUrl} target="_blank">
                <HiOutlineDocumentDuplicate />
              </Link>
            </HStack>
            <iframe
              key={appInfo.version}
              src={iframeUrl}
              ref={iframeRef}
              width="100%"
              height="100%"
              onLoad={() => {
                setIframeLoadCount(iframeLoadCount + 1);
              }}
              style={{ flexGrow: 1 }}
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
