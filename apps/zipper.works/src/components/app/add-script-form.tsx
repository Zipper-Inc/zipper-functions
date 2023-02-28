import {
  FormErrorMessage,
  Input,
  Button,
  FormControl,
  HStack,
  Link,
  VStack,
  Text,
  Box,
  Flex,
  Tabs,
  TabList,
  Tab,
  TabPanel,
  TabPanels,
  Icon,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppConnector, Script } from '@prisma/client';
import { HiPaperAirplane } from 'react-icons/hi2';
import { connectors as defaultConnectors } from '~/connectors/connectors';
import { useEffect, useState } from 'react';
import { useEditorContext } from '../context/editor-context';
import slugify from '~/utils/slugify';
import { useDebounce } from 'use-debounce';

export default function AddScriptForm({
  appId,
  connectors,
}: {
  appId: string;
  connectors: AppConnector[];
}) {
  const [duplicateFilename, setDuplicateFilename] = useState<
    string | undefined
  >();
  const { register, handleSubmit, reset, watch } = useForm();
  const { setCurrentScript, scripts } = useEditorContext();
  const utils = trpc.useContext();
  const addScript = trpc.useMutation('script.add', {
    async onSuccess(script) {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byId', { id: appId }]);
      setCurrentScript(script as Script);
      reset();
    },
  });

  const [debouncedName] = useDebounce(watch('name'), 500);

  const validateFilenameQuery = trpc.useQuery(
    [
      'script.validateFilename',
      { appId, newFilename: slugify((debouncedName as string) || '') },
    ],
    { enabled: !!debouncedName },
  );

  useEffect(() => {
    if (validateFilenameQuery.data) {
      setDuplicateFilename(undefined);
    } else {
      setDuplicateFilename(debouncedName);
    }
  }, [validateFilenameQuery.data]);

  return (
    <Tabs colorScheme="purple">
      <TabList>
        <Tab>Custom</Tab>
        <Tab>Connectors</Tab>
      </TabList>
      <TabPanels>
        <TabPanel px="2">
          <Text mb="2">Add a new function</Text>
          <form
            onSubmit={handleSubmit(
              ({ name, description, code = '// Here we go!' }) => {
                addScript.mutateAsync({
                  name,
                  description,
                  code: code,
                  appId,
                  order: scripts.length + connectors.length + 1,
                });
              },
            )}
            style={{ display: 'block', width: '100%' }}
          >
            {addScript.error && (
              <FormErrorMessage>{addScript.error.message}</FormErrorMessage>
            )}
            <Box>
              <VStack align="start">
                <HStack align={'start'}>
                  <FormControl>
                    <Input
                      size="md"
                      type="text"
                      placeholder="Script name"
                      disabled={addScript.isLoading}
                      isInvalid={!!duplicateFilename}
                      autoComplete="off"
                      data-form-type="other"
                      {...register('name')}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    paddingX={2}
                    isDisabled={addScript.isLoading || !!duplicateFilename}
                    bgColor="purple.800"
                    textColor="gray.100"
                  >
                    <Icon as={HiPaperAirplane} />
                  </Button>
                </HStack>
                {watch('name') && !duplicateFilename && (
                  <Flex>
                    <Text fontSize="sm" mt="2" color={'gray.600'}>
                      A file called{' '}
                      <Text fontFamily="mono" as="span">
                        {slugify(watch('name'))}.ts
                      </Text>{' '}
                      will be created
                    </Text>
                  </Flex>
                )}
                {watch('name') === duplicateFilename && (
                  <Flex>
                    <Text fontSize="sm" mt="2" color={'red.500'}>
                      A file with that name already exists.
                    </Text>
                  </Flex>
                )}
              </VStack>
            </Box>
          </form>
        </TabPanel>
        <TabPanel>
          <VStack align="start">
            {Object.values(defaultConnectors).map((connector) => {
              if (!connectors.find((c: any) => c.type === connector.id)) {
                return (
                  <HStack key={connector.id}>
                    {connector.icon}
                    <Link
                      key={connector.id}
                      onClick={() => {
                        addScript.mutateAsync({
                          name: `${connector.id}-connector`,
                          code: connector.code || '// Here we go!',
                          appId,
                          order: scripts.length + connectors.length + 1,
                          connectorId: connector.id,
                        });
                      }}
                    >
                      {connector.name}
                    </Link>
                  </HStack>
                );
              } else {
                return (
                  <HStack key={connector.id}>
                    {connector.icon}
                    <Text>{connector.name} already added</Text>
                  </HStack>
                );
              }
            })}
          </VStack>
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
}
