import {
  Box,
  Button,
  Code,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const CODE_EXAMPLE = `function main() {
  // this is an example
  return {
    "hello": "world",
    "datetime": new Date().toString(),
  }
}
`;

let Editor;

const AppPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const router = useRouter();
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);
  const scriptsQuery = trpc.useQuery(['script.byAppId', { appId: id }]);

  const [outputValue, setOutputValue] = React.useState('');

  const { register, handleSubmit, reset } = useForm();

  const savedCode = scriptsQuery.data?.reduce((prev, curr) => {
    return `
    ${prev}
    ${curr.code}
    `;
  }, '');

  const [shouldRenderEditor, setShouldRenderEditor] = useState(false);
  useEffect(() => {
    import('@prisma/text-editors').then((module) => {
      Editor = module.Editor;
      if (Editor) setShouldRenderEditor(true);
    });
  }, []);
  const [code, setCode] = useState(savedCode || CODE_EXAMPLE);

  const runApp = async () => {
    const raw = await fetch('/api/run', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });

    const res = await raw.json();

    setOutputValue(res.output);
  };

  const forkApp = trpc.useMutation('app.fork', {
    async onSuccess(data) {
      router.push(`/app/${data.id}`);
    },
  });

  const addScript = trpc.useMutation('script.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['script.byAppId', { appId: id }]);
      reset();
    },
  });

  if (appQuery.error) {
    return (
      <NextError
        title={appQuery.error.message}
        statusCode={appQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (appQuery.status !== 'success') {
    return <>Loading...</>;
  }
  const { data } = appQuery;
  return (
    <>
      <Box margin="8">
        <VStack spacing={4} align={'start'}>
          <Heading as="h1" size="xl" noOfLines={1}>
            {data.name}
          </Heading>
          <Text fontSize="lg">{data.description}</Text>
          <Heading size="lg" marginBottom={4}>
            Functions
            {scriptsQuery.status === 'loading' && '(loading)'}
          </Heading>
          {scriptsQuery.data?.map((script) => (
            <Box as="article" key={script.hash} marginY="4">
              <Heading as="h3" size="md">
                {script.name}
              </Heading>

              <Text size="md">{script.description}</Text>

              <Code size="md">{script.code}</Code>
            </Box>
          ))}
          <Button
            type="button"
            paddingX={6}
            bgColor="purple.800"
            textColor="gray.100"
            onClick={() => {
              forkApp.mutateAsync({ id });
            }}
          >
            Explore this App
          </Button>
          <Button
            type="button"
            paddingX={6}
            bgColor="purple.800"
            textColor="gray.100"
            onClick={() => {
              runApp();
            }}
          >
            Run
          </Button>
          {outputValue && Editor && (
            <>
              <Heading size="md">Output</Heading>
              <Editor
                readonly
                lang="json"
                value={JSON.stringify(outputValue, null, 2)}
              />
            </>
          )}
          <hr />
          <Heading size="lg" marginBottom={4}>
            Create an App
          </Heading>
          <form
            onSubmit={handleSubmit(({ name, description, code }) => {
              addScript.mutateAsync({ name, description, code, appId: id });
            })}
            style={{ display: 'block', width: '100%' }}
          >
            {addScript.error && (
              <FormErrorMessage>{addScript.error.message}</FormErrorMessage>
            )}
            <VStack align={'start'}>
              <FormControl as={React.Fragment}>
                <FormLabel>Name:</FormLabel>
                <Input
                  size="md"
                  type="text"
                  disabled={addScript.isLoading}
                  {...register('name')}
                />
              </FormControl>
              <FormControl as={React.Fragment}>
                <FormLabel>Description:</FormLabel>
                <Input
                  size="md"
                  type="text"
                  disabled={addScript.isLoading}
                  {...register('description')}
                />
              </FormControl>
              {Editor && (
                <FormControl as={React.Fragment}>
                  <FormLabel>Code:</FormLabel>
                  <Editor
                    lang="ts"
                    theme="dark"
                    value={code}
                    onChange={setCode}
                    // faking some types
                    types={{
                      '/index.d.ts':
                        'export type Zipper = { store: (k, v) => void }',
                    }}
                  />
                </FormControl>
              )}
              <Button
                type="submit"
                paddingX={6}
                disabled={addScript.isLoading}
                bgColor="purple.800"
                textColor="gray.100"
              >
                Submit
              </Button>
            </VStack>
          </form>
        </VStack>
      </Box>
    </>
  );
};

export default AppPage;
