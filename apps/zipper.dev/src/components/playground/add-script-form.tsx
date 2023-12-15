import {
  FormErrorMessage,
  Input,
  FormControl,
  HStack,
  VStack,
  Text,
  Flex,
  Button,
  useColorMode,
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
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
import { kebabCase } from '~/utils/kebab-case';
import { cloneElement, useMemo } from 'react';
import { foregroundColors } from '@zipper/ui';
import { allowedExtensionsWithDot } from '~/utils/file-extension';

export default function AddScriptForm({
  appId,
  connectors,
  onCreate,
}: {
  appId: string;
  connectors: Pick<AppConnector, 'type'>[];
  onCreate: (script: Script) => void;
}) {
  const { register, handleSubmit, reset: resetForm, watch } = useForm();
  const { setCurrentScript, scripts, refetchApp } = useEditorContext();

  const addScript = trpc.script.add.useMutation({
    async onSuccess(script) {
      // refetches posts after a post is added
      await refetchApp();
      setCurrentScript(script as Script);
      resetForm();
      onCreate(script as Script);
    },
  });

  const scriptFilename = watch('name');

  // Get extension from filename
  const extension = scriptFilename
    ? scriptFilename.match(/\.[^.]+$/)?.[0] ?? '.tsx'
    : '.ts';

  const slugifiedName = slugifyAllowDot(
    kebabCase(scriptFilename?.replace(/\..+$/, '') ?? ''),
  );

  const slugifiedFilename = slugifiedName + extension;

  const { isFilenameValid } = useScriptFilename(
    scriptFilename,
    appId,
    allowedExtensionsWithDot,
  );

  const connectorsList = useMemo(() => {
    const connectors_data = {
      databases: [],
      appsOauth: [],
    } as Record<'databases' | 'appsOauth', Connector[]>;

    Object.values(defaultConnectors)
      .reduce((acc, curr) => {
        if (!connectors.find((c: any) => c.type === curr.id)) {
          acc.unshift(curr);
        } else {
          acc.push(curr);
        }
        return acc;
      }, [] as Array<Connector>)
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((connector) => {
        if (['mongodb', 'postgres', 'mysql'].includes(connector.id)) {
          return connectors_data.databases.push(connector);
        }
        return connectors_data.appsOauth.push(connector);
      });

    return connectors_data;
  }, [defaultConnectors, connectors]);

  const { colorMode } = useColorMode();

  const ConnectorLine = (connector: Connector) => {
    if (!connectors.find((c: any) => c.type === connector.id)) {
      return (
        <Button
          variant="ghost"
          key={connector.id}
          justifyContent="start"
          fontWeight="normal"
          height="3.2rem"
          py="3"
          w="full"
          onClick={() => {
            addScript.mutateAsync({
              filename: `${connector.id}-connector.tsx`,
              code: connector.code,
              appId,
              order: scripts.length + connectors.length + 1,
              connectorId: connector.id,
            });
          }}
        >
          <VStack align="start" spacing="0.5">
            <HStack key={connector.id}>
              {connector.icon &&
                cloneElement(connector.icon, {
                  color:
                    colorMode === 'light'
                      ? foregroundColors['fg.800'].default
                      : foregroundColors['fg.800']._dark,
                })}
              <Text color="fg.600">{connector.name}</Text>
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
          key={connector.id}
          variant="ghost"
          justifyContent="start"
          fontWeight="normal"
          onClick={() => undefined}
          color="fg.400"
          _hover={{
            bg: 'bg.50',
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
  };

  return (
    <VStack alignItems="stretch" spacing={0} gap={4} minW={0}>
      <VStack alignItems="stretch" p="3" pb="1">
        <Text size="sm" color="fg.700" fontWeight="medium">
          Create a script
        </Text>
        <form
          onSubmit={handleSubmit(({ description }) => {
            if (isFilenameValid) {
              addScript.mutateAsync({
                filename: slugifiedFilename,
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
                color={'fg.800'}
                disabled={addScript.isLoading}
                isInvalid={scriptFilename && !isFilenameValid}
                data-form-type="other"
                {...register('name')}
              />
            </FormControl>
            {scriptFilename && isFilenameValid && (
              <Text fontWeight="medium" fontSize="sm" color="fg.700" pt="2">
                Press return to add{' '}
                <Text as={'span'} fontWeight="bold">
                  {slugifiedFilename}
                </Text>
              </Text>
            )}
            {scriptFilename && isFilenameValid === false && (
              <Flex>
                <Text fontSize="sm" mt="2" color={'red.500'}>
                  {slugifiedFilename.length < 4
                    ? 'Filename must be at least 1 character'
                    : 'A file with that name already exists'}
                </Text>
              </Flex>
            )}
          </VStack>
        </form>
      </VStack>
      <VStack alignItems="stretch">
        <VStack align="stretch" spacing="0">
          <Accordion
            defaultIndex={[0]}
            allowMultiple
            overflow="auto"
            maxH="420px"
          >
            <AccordionItem>
              <h2>
                <AccordionButton bg="fg.100" _hover={{ bg: 'fg.200' }} h={6}>
                  <Box
                    as="span"
                    flex="1"
                    textAlign="left"
                    fontSize="sm"
                    color="fg.600"
                    fontWeight="bold"
                    textTransform="uppercase"
                  >
                    Apps & Oauth
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel px={0} py={0}>
                {connectorsList.appsOauth.map((connector) => (
                  <ConnectorLine key={connector.id} {...connector} />
                ))}
              </AccordionPanel>
            </AccordionItem>

            <AccordionItem>
              <h2>
                <AccordionButton bg="fg.100" _hover={{ bg: 'fg.200' }} h={6}>
                  <Box
                    as="span"
                    flex="1"
                    textAlign="left"
                    fontSize="sm"
                    color="fg.600"
                    fontWeight="bold"
                    textTransform="uppercase"
                  >
                    Databases
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel px={0} py={0}>
                {connectorsList.databases.map((connector) => (
                  <ConnectorLine key={connector.id} {...connector} />
                ))}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </VStack>
      </VStack>
    </VStack>
  );
}
