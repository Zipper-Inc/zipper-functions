import {
  Box,
  Button,
  Divider,
  FormControl,
  FormErrorMessage,
  FormLabel,
  GridItem,
  Heading,
  HStack,
  Input,
  Link,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextError from 'next/error';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { NextPageWithLayout } from '~/pages/_app';
import { trpc } from '~/utils/trpc';
import dynamic from 'next/dynamic';
import { Script } from '@prisma/client';
import DefaultGrid from '~/components/default-grid';

const Editor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
});

const AppPage: NextPageWithLayout = () => {
  const utils = trpc.useContext();
  const { query } = useRouter();
  const id = query.id as string;
  const filename = query.filename as string;

  const appQuery = trpc.useQuery(['app.byId', { id }]);

  const editAppMutation = trpc.useMutation('app.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id }]);
      reset();
    },
  });

  const [scripts, setScripts] = useState<Script[]>([]);

  const [outputValue, setOutputValue] = React.useState('');

  const { register, handleSubmit, reset } = useForm();

  const mainScript = scripts?.find(
    (script) => script.id === appQuery.data?.scriptMain?.scriptId,
  );

  const currentScript =
    scripts?.find((script) => script.filename === filename) || mainScript;

  useEffect(() => {
    setScripts(appQuery.data?.scripts || []);
  }, [appQuery.isSuccess]);

  const runApp = async () => {
    const raw = await fetch('/api/run', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code: currentScript?.code || '' }),
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

  console.log('ibu', { data, scripts, currentScript });

  return (
    <DefaultGrid>
      <GridItem colSpan={7}>
        <HStack>
          <Link>Apps</Link>
          <Link>Runs</Link>
          <Link>Schedules</Link>
          <Link>Secrets</Link>
        </HStack>
      </GridItem>
      <GridItem colSpan={2} justifyContent="end">
        <HStack>
          <Button>Share</Button>
          <Button
            onClick={() => {
              editAppMutation.mutateAsync({
                id,
                data: {
                  scripts: scripts.map((script) => {
                    return {
                      id: script.id,
                      data: {
                        name: script.name,
                        description: script.description || '',
                        code: script.code,
                      },
                    };
                  }),
                },
              });
            }}
          >
            Save
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
        </HStack>
      </GridItem>
      <GridItem colSpan={3} />
      <GridItem colSpan={3}>
        <Heading as="h1" size="md" pb={5}>
          {data.name}
        </Heading>
        <VStack alignItems="start" gap={2}>
          {scripts
            .sort((a, b) => {
              let orderA;
              let orderB;

              // always make sure `main` is on top, respect order after
              if (a.id === mainScript?.id) orderA = -Infinity;
              else orderA = a.order === null ? Infinity : a.order;
              if (b.id === mainScript?.id) orderB = -Infinity;
              else orderB = b.order === null ? Infinity : b.order;
              return orderA > orderB ? 1 : -1;
            })
            .map((script, i) => (
              <>
                <NextLink href={`/app/${id}/edit/${script.filename}`} passHref>
                  <Link
                    size="sm"
                    background="purple.200"
                    borderRadius={2}
                    px={2}
                  >
                    <b>{script.name}</b>
                  </Link>
                </NextLink>
                {i === 0 && (
                  <Text size="sm" color="gray.500">
                    Other functions
                  </Text>
                )}
              </>
            ))}
        </VStack>
        <Divider my={5} />

        <Heading size="md" marginBottom={4}>
          Create a function
        </Heading>
        <form
          onSubmit={handleSubmit(
            ({ name, description, code = '// Here we go!' }) => {
              addScript.mutateAsync({
                name,
                description,
                code: code,
                appId: id,
                order: scripts.length,
              });
            },
          )}
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
      <GridItem colSpan={6}>
        {Editor && (
          <VStack>
            <Box width="100%">
              <FormControl as={React.Fragment}>
                <Heading as="h2" size="lg">
                  {currentScript?.name || 'Untitled'}
                </Heading>
                <Box
                  style={{
                    backgroundColor: '#1e1e1e',
                    height: '100vh',
                    color: '#1e1e1e',
                  }}
                >
                  <Editor
                    key={currentScript?.filename}
                    defaultLanguage="typescript"
                    height="100vh"
                    value={currentScript?.code || ''}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                    }}
                    onChange={(value) => {
                      setScripts(
                        scripts.map((script) => {
                          if (script.filename === currentScript?.filename) {
                            return { ...script, code: value || '' };
                          }
                          return script;
                        }),
                      );
                    }}
                  />
                </Box>
              </FormControl>
            </Box>
          </VStack>
        )}
      </GridItem>
      <GridItem colSpan={3}>
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
    </DefaultGrid>
  );
};

export default AppPage;
