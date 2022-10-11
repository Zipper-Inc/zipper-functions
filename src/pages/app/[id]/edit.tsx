import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Grid,
  GridItem,
  Heading,
  HStack,
  Input,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextError from 'next/error';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

const CODE_EXAMPLE = `function main() {
  // this is an example
  return {
    "hello": "world",
    "datetime": new Date().toString(),
  }
}
`;

const AppPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);

  const [allFunctions, setAllFunctions] = useState<Record<
    string,
    string | null
  > | null>();

  const [outputValue, setOutputValue] = React.useState('');

  const { register, handleSubmit, reset } = useForm();

  const [currentScript, setCurrentScript] = useState<string>('main');
  const [currentEditorCode, setCurrentEditorCode] = useState(
    appQuery.data?.code || CODE_EXAMPLE,
  );

  useEffect(() => {
    setAllFunctions(appQuery.data?.allCode);
    setCurrentEditorCode(allFunctions?.main || CODE_EXAMPLE);
  }, [appQuery.isSuccess]);

  useEffect(() => {
    setCurrentEditorCode(allFunctions?.[currentScript] || CODE_EXAMPLE);
  }, [currentScript]);

  const runApp = async () => {
    const raw = await fetch('/api/run', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: currentEditorCode }),
    });

    const res = await raw.json();

    setOutputValue(res.output);
  };

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
    <Grid templateColumns="280px 1fr 1fr 350px" gap={6}>
      <GridItem colSpan={2}>
        <HStack>
          <Link>Apps</Link>
          <Link>Runs</Link>
          <Link>Schedules</Link>
          <Link>Secrets</Link>
        </HStack>
      </GridItem>
      <GridItem display="flex" justifyContent="end">
        <HStack>
          <Button>Share</Button>
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
        </HStack>
      </GridItem>
      <GridItem></GridItem>
      <GridItem>
        <Heading as="h1" size="md" pb={5}>
          {data.name}
        </Heading>
        <VStack alignItems="start" gap={2}>
          <Link
            background="purple.200"
            borderRadius={2}
            px={2}
            onClick={() => {
              setCurrentScript('main');
            }}
          >
            <b>Main</b>
          </Link>
          <Text>Other Functions:</Text>
          {appQuery.data?.scripts.map((script) => (
            <Link
              size="sm"
              background="purple.200"
              borderRadius={2}
              px={2}
              onClick={() => {
                setCurrentScript(script.name);
              }}
            >
              <b>{script.name}</b>
            </Link>
          ))}
        </VStack>
        <Divider my={5} />

        <Heading size="md" marginBottom={4}>
          Create a function
        </Heading>
        <form
          onSubmit={handleSubmit(({ name, description, code }) => {
            addScript.mutateAsync({
              name,
              description,
              code: code || CODE_EXAMPLE,
              appId: id,
            });
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
      </GridItem>
      <GridItem colSpan={2}>
        {Editor && (
          <VStack>
            <Box maxH="1000px" flex="1">
              <FormControl as={React.Fragment}>
                <Editor
                  height="80vh"
                  defaultLanguage="typescript"
                  defaultValue={currentEditorCode}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                  }}
                />
              </FormControl>
              <p>What the editor should be: {currentEditorCode}</p>
            </Box>
          </VStack>
        )}
      </GridItem>
      <GridItem>
        {outputValue && Editor && (
          <>
            <Heading size="md">Output</Heading>
            <Editor
              defaultLanguage="json"
              defaultValue={JSON.stringify(outputValue, null, 2)}
              options={{
                minimap: { enabled: false, readOnly: true },
              }}
            />
          </>
        )}
      </GridItem>
    </Grid>
  );
};

export default AppPage;
