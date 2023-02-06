import { useState } from 'react';
import { GetServerSideProps } from 'next';
import { InputParamsForm, withDefaultTheme, ZipperLogo } from '@zipper/ui';
import { AppInfo, InputParams } from '@zipper/types';
import getAppInfo from '~/utils/get-app-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { VERSION_DELIMETER } from '~/utils/get-version-from-url';
import {
  Box,
  Heading,
  Flex,
  Text,
  ButtonGroup,
  Button,
  Divider,
  Code,
} from '@chakra-ui/react';
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { getInputValuesFromUrl } from '../utils/get-input-values-from-url';

export function AppPage({
  app,
  inputs,
  version = app.lastDeploymentVersion || Date.now().toString(),
  defaultValues,
}: {
  app: AppInfo;
  inputs: InputParams;
  version?: string;
  defaultValues?: Record<string, any>;
}) {
  const appTitle = app.name || app.slug;
  const formContext = useForm({ defaultValues });
  const [result, setResult] = useState('');

  return (
    <>
      <Head>
        <title>{appTitle}</title>
      </Head>
      <Box as="main">
        <Flex as="header" mx={8} my={4} alignItems="center" color="gray.600">
          <Heading as="h2" color="black">
            {appTitle}
          </Heading>
          <Text
            fontWeight="100"
            ml={1}
            fontSize="3xl"
            height="full"
            color="gray.400"
          >
            @{version}
          </Text>
          <Text fontSize="sm" ml="auto">
            Powered by
          </Text>
          <ZipperLogo
            fill="currentColor"
            style={{ marginLeft: '8px', height: '13px' }}
          />
        </Flex>
        {app.description && <p>{app.description}</p>}
        <Box bg="gray.100" px={8} py={4}>
          <InputParamsForm params={inputs} formContext={formContext} />
          <Divider orientation="horizontal" my={4} />
          <Flex>
            <ButtonGroup>
              <Button
                colorScheme="purple"
                onClick={async () => {
                  const rawValues = formContext.getValues();
                  const values: Record<string, any> = {};
                  Object.keys(rawValues).forEach((k) => {
                    const parts = k.split(':');
                    parts.unshift();
                    const key = parts.join(':');
                    values[key] = rawValues[k];
                  });

                  const result = await fetch('/call', {
                    method: 'POST',
                    body: JSON.stringify(values),
                  }).then((r) => r.text());

                  if (result) setResult(result);
                }}
              >
                Run
              </Button>
              <Button
                onClick={() => {
                  setResult('');
                  formContext.reset();
                }}
              >
                Reset
              </Button>
            </ButtonGroup>
          </Flex>
        </Box>
      </Box>
      {result && (
        <Code bgColor="black" color="white" py={4} px={8}>
          {result}
        </Code>
      )}
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  req,
  query,
}) => {
  const { host } = req.headers;

  // validate subdomain
  const subdomain = getValidSubdomain(host);
  if (!subdomain) return { notFound: true };

  // validate version if it exists
  const versionFromUrl = query.version as string;
  if (versionFromUrl && !versionFromUrl.startsWith(VERSION_DELIMETER))
    return { notFound: true };

  // grab the app if it exists
  const result = await getAppInfo(subdomain);
  if (!result.ok) return { notFound: true };

  const { app, inputs } = result.data;
  const version =
    versionFromUrl ||
    app.lastDeploymentVersion?.toString() ||
    Date.now().toString();
  const defaultValues = getInputValuesFromUrl(inputs, req.url);

  return {
    props: {
      app,
      inputs,
      version,
      defaultValues,
    },
  };
};

export default withDefaultTheme(AppPage);
