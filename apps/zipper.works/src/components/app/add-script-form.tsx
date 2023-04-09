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
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { AppConnector, Script } from '@prisma/client';
import { connectors as defaultConnectors } from '~/connectors/connectors';
import { useEditorContext } from '../context/editor-context';
import slugify from '~/utils/slugify';
import { useScriptFilename } from '~/hooks/use-script-filename';
import { HiCheck } from 'react-icons/hi';

export default function AddScriptForm({
  appId,
  connectors,
  onCreate,
}: {
  appId: string;
  connectors: Pick<AppConnector, 'type'>[];
  onCreate: VoidFunction;
}) {
  const { register, handleSubmit, reset, watch } = useForm();
  const { setCurrentScript, scripts, refetchApp } = useEditorContext();

  const addScript = trpc.useMutation('script.add', {
    async onSuccess(script) {
      // refetches posts after a post is added
      refetchApp();
      setCurrentScript(script as Script);
      reset();
      onCreate();
    },
  });

  const scriptFilename = watch('name');
  const { isFilenameValid } = useScriptFilename(scriptFilename, appId);
  const slugifiedScriptFilename = slugify(scriptFilename ?? '');

  return (
    <VStack alignItems="stretch" spacing={0} gap={4} minW={0}>
      <VStack alignItems="stretch">
        <Text size="sm" color="gray.700" fontWeight="medium">
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
              <Text fontWeight="medium" fontSize="sm" color="gray.700">
                Press return to add{' '}
                <Text fontFamily="mono" as="span">
                  {slugifiedScriptFilename}.ts
                </Text>
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
        <Text size="sm" color="gray.700" fontWeight="medium">
          Add a pre-built connector
        </Text>
        <VStack align="stretch">
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
                <HStack
                  key={connector.id}
                  justifyContent="space-between"
                  spacing={4}
                >
                  <HStack>
                    {connector.icon}
                    <Text>{connector.name}</Text>
                  </HStack>
                  <HStack color="gray.400" spacing={1} fontSize="xs">
                    <Text>CONNECTED</Text>
                    <HiCheck />
                  </HStack>
                </HStack>
              );
            }
          })}
        </VStack>
      </VStack>
    </VStack>
  );
}
