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
import slugify from 'slugify';
import { connectors as defaultConnectors } from '~/config/connectors';
import { VscGithub } from 'react-icons/vsc';
import { useContext } from 'react';
import { EditorContext } from '../context/editorContext';

export default function AddScriptForm({
  appId,
  connectors,
}: {
  appId: string;
  connectors: AppConnector[];
}) {
  const { register, handleSubmit, reset, watch } = useForm();
  const { setCurrentScript, scripts } = useContext(EditorContext);
  const utils = trpc.useContext();
  const addScript = trpc.useMutation('script.add', {
    async onSuccess(script) {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byId', { id: appId }]);
      setCurrentScript(script as Script);
      reset();
    },
  });

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
                      autoComplete="off"
                      data-form-type="other"
                      {...register('name')}
                    />
                  </FormControl>
                  <Button
                    type="submit"
                    paddingX={2}
                    disabled={addScript.isLoading}
                    bgColor="purple.800"
                    textColor="gray.100"
                  >
                    <Icon as={HiPaperAirplane} />
                  </Button>
                </HStack>
                {watch('name') && (
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
              </VStack>
            </Box>
          </form>
        </TabPanel>
        <TabPanel>
          <VStack align="start">
            {defaultConnectors.map((connector) => {
              if (!connectors.find((c: any) => c.type === connector.id)) {
                return (
                  <HStack key={connector.id}>
                    <VscGithub />
                    <Link
                      key={connector.id}
                      onClick={() => {
                        addScript.mutateAsync({
                          name: `${connector.id}-connector`,
                          code: connector.code,
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
                  <HStack>
                    <VscGithub />
                    <Text key={connector.id}>
                      {connector.name} already added
                    </Text>
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
