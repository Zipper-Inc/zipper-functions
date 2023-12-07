import {
  Card,
  CardBody,
  VStack,
  Heading,
  HStack,
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

const PostgresDisconect: React.FC<{
  appId: string;
}> = ({ appId }) => {
  /* ------------------ States ------------------ */
  const [isSaving, setIsSaving] = useState(false);

  /* ------------------- Hooks ------------------ */
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  const utils = trpc.useContext();

  /* ----------------- Mutations ---------------- */
  const deleteConnectorMutation =
    trpc.mongodbConnector.deleteInstallation.useMutation({
      async onSuccess() {
        utils.mongodbConnector.get.invalidate({ appId });
        utils.secret.get.invalidate({
          appId,
          key: ['MONGO_CONNECTION_STRING'],
        });
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

  /* ------------------ Render ------------------ */
  return (
    <React.Fragment>
      <Card w="full">
        <CardBody color="fg.600">
          <VStack as="form" align="start" w="full" overflow="visible">
            <Heading size="sm">Configuration</Heading>

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
              Uninstall Postgres
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

export default PostgresDisconect;
