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
import React from 'react';
import { useForm } from 'react-hook-form';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';

const AppPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const router = useRouter();
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);
  const scriptsQuery = trpc.useQuery(['script.byAppId', { appId: id }]);

  const [outputValue, setOutputValue] = React.useState('');

  const { register, handleSubmit, reset } = useForm();

  const runApp = async () => {
    const allFunctions = scriptsQuery.data?.reduce((prev, curr) => {
      return `
    ${prev}
    ${curr.code}
    `;
    }, '');

    const raw = await fetch('/api/run', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: allFunctions }),
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

          <Code>{outputValue}</Code>

          <hr />

          <Heading size="lg" marginBottom={4}>
            Create an App
          </Heading>

          <form
            onSubmit={handleSubmit(({ name, description, code }) => {
              addScript.mutateAsync({ name, description, code, appId: id });
            })}
          >
            <Flex marginTop="4">
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
                <FormControl as={React.Fragment}>
                  <FormLabel>Code:</FormLabel>
                  <Input
                    size="md"
                    type="text"
                    disabled={addScript.isLoading}
                    {...register('code')}
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
            </Flex>
          </form>
        </VStack>
      </Box>
    </>
  );
};

export default AppPage;
