import {
  Card,
  CardBody,
  VStack,
  Heading,
  HStack,
  FormLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverHeader,
  PopoverBody,
  StackDivider,
  Code,
  Spacer,
  Text,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import React, { useRef, useState } from 'react';
import { HiOutlineTrash } from 'react-icons/hi';
import { trpc } from '~/utils/trpc';

const NotionDisconnect: React.FC<{
  appId: string;
  metadata: Record<string, any>;
}> = ({ appId, metadata }) => {
  /* ------------------ States ------------------ */
  const [isSaving, setIsSaving] = useState(false);

  /* ------------------- Hooks ------------------ */
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const utils = trpc.useContext();

  /* ----------------- Mutations ---------------- */
  const deleteConnectorMutation =
    trpc.notionConnector.deleteInstallation.useMutation({
      async onSuccess() {
        await utils.notionConnector.get.invalidate({ appId });
        await utils.secret.get.invalidate({ appId, key: 'NOTION_BOT_TOKEN' });
      },
    });

  /* ----------------- Callbacks ---------------- */
  async function onDeleteInstallation() {
    setIsSaving(true);

    await deleteConnectorMutation.mutateAsync({
      appId,
    });

    return setIsSaving(false), onClose();
  }

  console.log(metadata);

  /* ------------------ Render ------------------ */
  return (
    <React.Fragment>
      <Card w="full">
        <CardBody color="fg.600">
          <VStack as="form" align="start" w="full" overflow="visible">
            <Heading size="sm">Configuration</Heading>
            <HStack pt="4" pb="4" w="full">
              <FormLabel m="0">Installed to</FormLabel>
              <Popover trigger="hover">
                <PopoverTrigger>
                  <FormLabel
                    cursor="context-menu"
                    textDecor="underline"
                    textDecorationStyle="dotted"
                    color={'fg.900'}
                  >
                    {metadata['workspace_name']}
                  </FormLabel>
                </PopoverTrigger>
                <PopoverContent w="sm">
                  <PopoverArrow />
                  <PopoverHeader>Installation details</PopoverHeader>
                  <PopoverBody>
                    <VStack
                      align="start"
                      divider={<StackDivider />}
                      fontSize="sm"
                      py="2"
                    >
                      <HStack>
                        <Text>Bot User ID:</Text>
                        <Code>{metadata['bot_id']}</Code>
                      </HStack>
                    </VStack>
                  </PopoverBody>
                </PopoverContent>
              </Popover>
              <Spacer />
            </HStack>
            <Button variant="unstyled" color="red.600" onClick={onOpen}>
              <HStack>
                <HiOutlineTrash />
                <Text>Uninstall</Text>
              </HStack>
            </Button>
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
              Uninstall Notion App
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
                onClick={onDeleteInstallation}
                ml={3}
              >
                Uninstall
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </React.Fragment>
  );
};

export default NotionDisconnect;
