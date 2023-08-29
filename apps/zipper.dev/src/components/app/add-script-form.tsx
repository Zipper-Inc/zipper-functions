import {
  FormErrorMessage,
  Input,
  FormControl,
  HStack,
  Link,
  VStack,
  Text,
  Flex,
  Divider,
  Button,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppConnector, Script } from '@prisma/client';
import { connectors as defaultConnectors } from '~/connectors/connectors';
import { useEditorContext } from '../context/editor-context';
import { slugifyAllowDot } from '~/utils/slugify';
import { useScriptFilename } from '~/hooks/use-script-filename';
import { HiCheck } from 'react-icons/hi';
import { Connector } from '~/connectors/createConnector';

export default function AddScriptForm({
  appId,
  connectors,
  onCreate,
}: {
  appId: string;
  connectors: Pick<AppConnector, 'type'>[];
  onCreate: (script: Script) => void;
}) {
  const { register, handleSubmit, reset, watch } = useForm();
  const { setCurrentScript, scripts, refetchApp } = useEditorContext();

  const addScript = trpc.useMutation('script.add', {
    async onSuccess(script) {
      // refetches posts after a post is added
      await refetchApp();
      setCurrentScript(script as Script);
      reset();
      onCreate(script as Script);
    },
  });

  const scriptFilename = watch('name');

  // Get extension from filename
  const extension = scriptFilename
    ? scriptFilename.match(/\.[^.]+$/)?.[0] ?? '.ts'
    : '.ts';

  const slugifiedName = slugifyAllowDot(
    scriptFilename?.replace(/\..+$/, '') ?? '',
  );

  const slugifiedFilename = slugifiedName + extension;

  const { isFilenameValid } = useScriptFilename(scriptFilename, appId, [
    '.ts',
    '.md',
  ]);

  const slugifiedScriptFilename = slugifyAllowDot(scriptFilename ?? '');

  return (
    <VStack alignItems="stretch" spacing={0} gap={4} minW={0}>
      <VStack alignItems="stretch" p="3" pb="1">
        <Text size="sm" color="fg.700" fontWeight="medium">
          Create a script
        </Text>
        <form
          onSubmit={handleSubmit(({ name, description }) => {
            if (isFilenameValid) {
              addScript.mutateAsync({
                name,
                description,
                appId,
                order: scripts.length + connectors.length + 1,
              });
            }
          })}
        >
          {addScript.error && (
            <FormErrorMessage>{addScript.error.message}</FormErrorMessage>
          )}
          <VStack align="stretch">
            <FormControl>
              <Input
                px={4}
                size="md"
                type="text"
                placeholder="File name"
                disabled={addScript.isLoading}
                isInvalid={scriptFilename && !isFilenameValid}
                autoComplete="off"
                data-form-type="other"
                {...register('name')}
              />
            </FormControl>
            {scriptFilename && isFilenameValid && (
              <Text fontWeight="medium" fontSize="sm" color="fg.700">
                Press return to add <Text>{slugifiedFilename}</Text>
              </Text>
            )}
            {scriptFilename && isFilenameValid === false && (
              <Flex>
                <Text fontSize="sm" mt="2" color={'red.500'}>
                  A file with that name already exists.
                </Text>
              </Flex>
            )}
          </VStack>
        </form>
      </VStack>
      <Divider />
      <VStack alignItems="stretch">
        <Text size="sm" color="fg.700" fontWeight="medium" px="3" pb="1">
          Add a pre-built connector
        </Text>
        <VStack align="stretch" spacing="0" pb="2">
          {Object.values(defaultConnectors)
            .reduce((acc, curr) => {
              if (!connectors.find((c: any) => c.type === curr.id)) {
                acc.unshift(curr);
              } else {
                acc.push(curr);
              }
              return acc;
            }, [] as Array<Connector>)
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((connector) => {
              if (!connectors.find((c: any) => c.type === connector.id)) {
                return (
                  <Button
                    variant="ghost"
                    key={connector.id}
                    justifyContent="start"
                    fontWeight="normal"
                    height="3.2rem"
                    py="3"
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
                    <VStack align="start" spacing="0.5">
                      <HStack key={connector.id}>
                        {connector.icon}
                        <Text>{connector.name}</Text>
                      </HStack>
                      {connector.description && (
                        <Text fontSize="xs" color="fg.500" pl="6">
                          {connector.description}
                        </Text>
                      )}
                    </VStack>
                  </Button>
                );
              } else {
                return (
                  <Button
                    variant="ghost"
                    justifyContent="start"
                    fontWeight="normal"
                    onClick={() => undefined}
                    color="fg.400"
                    _hover={{
                      bg: 'bg.100',
                      cursor: 'default',
                    }}
                  >
                    <HStack
                      key={connector.id}
                      w="full"
                      justifyContent="space-between"
                      spacing={4}
                    >
                      <HStack>
                        {connector.icon}
                        <Text>{connector.name}</Text>
                      </HStack>
                      <HStack color="fg.400" spacing={1} fontSize="xs">
                        <Text>CONNECTED</Text>
                        <HiCheck />
                      </HStack>
                    </HStack>
                  </Button>
                );
              }
            })}
        </VStack>
      </VStack>
    </VStack>
  );
}
