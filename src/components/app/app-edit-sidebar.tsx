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
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { FormProvider } from 'react-hook-form';
import { HiOutlineDocumentDuplicate, HiRefresh } from 'react-icons/hi';
import InputParamsForm from '~/components/edit-app-page/input-params-form';
import { LogLine } from '~/components/edit-app-page/log-line';

export function AppEditSidebar({
  inputParamsFormMethods,
  inputParams,
  inputValues,
  appEventsQuery,
  appInfo,
}: any) {
  const [tabIndex, setTabIndex] = useState(0);
  const [urlSearchParams, setUrlSearchParams] = useState('');
  const [iframeUrl, setIframeUrl] = useState('');

  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleTabsChange = (index: number) => {
    setTabIndex(index);
  };

  const logs = appEventsQuery.data?.map((event: any) => event.eventPayload);

  useEffect(() => {
    setUrlSearchParams(new URLSearchParams(inputValues).toString());
  }, [inputValues]);

  useEffect(() => {
    setIframeUrl(
      `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${
        appInfo.slug
      }.zipper.localhost:4001/?${urlSearchParams}`,
    );
  }, [appInfo, urlSearchParams]);

  return (
    <Tabs as="aside" index={tabIndex} onChange={handleTabsChange}>
      <TabList>
        <Tab>Inputs</Tab>
        <Tab>Results</Tab>
        <Tab isDisabled={!logs?.length}>Logs</Tab>
      </TabList>
      <TabPanels>
        <TabPanel backgroundColor="gray.100">
          <FormProvider {...inputParamsFormMethods}>
            <InputParamsForm params={inputParams} defaultValues={{}} />
          </FormProvider>
        </TabPanel>
        <TabPanel p="0">
          <VStack align="start">
            <Box w="full" p="2" backgroundColor="gray.100">
              <HStack>
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
            </Box>
            <iframe
              key={appInfo.version}
              src={iframeUrl}
              ref={iframeRef}
              width="100%"
              height="100%"
            />
          </VStack>
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
