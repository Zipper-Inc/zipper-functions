import { useRef, useState } from 'react';
import {
  VStack,
  Heading,
  FormLabel,
  Box,
  Card,
  CardBody,
  HStack,
  StackDivider,
  Spacer,
  Button,
  Text,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverTrigger,
  PopoverArrow,
  PopoverHeader,
  Code,
  FormControl,
  Input,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';

import { trpc } from '~/utils/trpc';
import { SiOpenai } from 'react-icons/si';
import createConnector from '../createConnector';
import { code } from './constants';
import { useRunAppContext } from '~/components/context/run-app-context';
import { HiOutlineTrash } from 'react-icons/hi';

export const openaiConnector = createConnector({
  id: 'openai',
  name: 'OpenAI',
  icon: <SiOpenai />,
  code,
  userScopes: [],
});

function OpenAIConnectorForm({ appId }: { appId: string }) {
  const { appInfo } = useRunAppContext();
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  const utils = trpc.useContext();

  const addSecret = trpc.useMutation('secret.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['secret.all', { appId }]);
    },
  });

  const deleteSecretMutation = trpc.useMutation('secret.delete', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['secret.get', { appId, key: tokenName }]);
      await utils.invalidateQueries(['secret.all', { appId }]);
      setApiKey('');
    },
  });

  const tokenName = 'OPENAI_API_KEY';

  const existingSecret = trpc.useQuery(
    ['secret.get', { appId, key: tokenName }],
    { enabled: !!appInfo?.canUserEdit },
  );

  const handleSaveApiKey = async () => {
    try {
      await addSecret.mutateAsync({
        appId,
        key: tokenName,
        value: apiKey,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Box px="6" w="full">
      {openaiConnector && (
        <>
          <Box mb="5">
            <Heading size="md">{openaiConnector.name} Connector</Heading>
          </Box>
          <VStack align="start">
            {appInfo.canUserEdit ? (
              <>
                {existingSecret.data ? (
                  <>
                    <Card w="full" gap={2}>
                      <CardBody color="gray.600">
                        <VStack align="start">
                          <Heading size="sm">Configuration</Heading>
                          <HStack w="full" pt="2" spacing="1">
                            <FormLabel m="0">Installed!</FormLabel>
                            <Spacer />

                            <Button
                              variant="unstyled"
                              color="red.600"
                              onClick={onOpen}
                            >
                              <HStack>
                                <HiOutlineTrash />
                                <Text>Uninstall</Text>
                              </HStack>
                            </Button>
                          </HStack>
                        </VStack>
                      </CardBody>
                    </Card>
                    <AlertDialog
                      isOpen={isOpen}
                      leastDestructiveRef={cancelRef}
                      onClose={onClose}
                    >
                      <AlertDialogOverlay>
                        <AlertDialogContent>
                          <AlertDialogHeader fontSize="lg" fontWeight="bold">
                            Uninstall OpenAI App
                          </AlertDialogHeader>

                          <AlertDialogBody>
                            Are you sure? You can't undo this action afterwards.
                          </AlertDialogBody>

                          <AlertDialogFooter>
                            <Button ref={cancelRef} onClick={onClose}>
                              Cancel
                            </Button>
                            <Button
                              colorScheme="red"
                              isDisabled={isSaving}
                              onClick={async () => {
                                setIsSaving(true);
                                await deleteSecretMutation.mutateAsync({
                                  appId,
                                  key: tokenName,
                                });
                                setIsSaving(false);
                                onClose();
                              }}
                              ml={3}
                            >
                              Uninstall
                            </Button>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialogOverlay>
                    </AlertDialog>
                  </>
                ) : (
                  <VStack align="start" w="full">
                    <Card w="full">
                      <CardBody color="gray.600">
                        <VStack
                          align="start"
                          w="full"
                          overflow="visible"
                          spacing="4"
                        >
                          <FormControl>
                            <FormLabel>API Key</FormLabel>
                            <Input
                              type="text"
                              placeholder="Enter your OpenAI API Key"
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                            />
                          </FormControl>
                          <Button
                            mt="6"
                            colorScheme={'purple'}
                            isDisabled={!apiKey || addSecret.isLoading}
                            onClick={handleSaveApiKey}
                          >
                            Save & Install
                          </Button>
                          <Text mt="10" color="gray.600">
                            After saving the API key, you can use the OpenAI
                            connector in your app.
                          </Text>
                        </VStack>
                      </CardBody>
                    </Card>
                  </VStack>
                )}
              </>
            ) : (
              <VStack align="start" w="full">
                <Card w="full">
                  <CardBody>
                    <Heading size="sm">Configuration</Heading>
                    <VStack
                      align="start"
                      divider={<StackDivider />}
                      fontSize="sm"
                      py="2"
                      mt="2"
                    ></VStack>
                  </CardBody>
                </Card>
              </VStack>
            )}
          </VStack>
        </>
      )}
    </Box>
  );
}

export default OpenAIConnectorForm;
