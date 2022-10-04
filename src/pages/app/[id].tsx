import {
  Box,
  Button,
  Code,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
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
  const id = useRouter().query.id as string;
  const appQuery = trpc.useQuery(['app.byId', { id }]);
  const scriptsQuery = trpc.useQuery(['script.byAppId', { appId: id }]);

  const { register, handleSubmit, reset } = useForm();

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
      <Box marginX="8">
        <h1>{data.name}</h1>
        <em>Created {data.createdAt.toLocaleDateString('en-us')}</em>

        <h2>Raw data:</h2>
        <pre>{JSON.stringify(data, null, 4)}</pre>

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

        <hr />

        <form
          onSubmit={handleSubmit(({ name, description, code }) => {
            addScript.mutateAsync({ name, description, code, appId: id });
          })}
        >
          <Flex marginTop="4">
            {addScript.error && (
              <FormErrorMessage>{addScript.error.message}</FormErrorMessage>
            )}
            <VStack>
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
      </Box>
    </>
  );
};

export default AppPage;
