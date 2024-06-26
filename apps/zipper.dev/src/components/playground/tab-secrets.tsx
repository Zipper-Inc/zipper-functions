import {
  Button,
  HStack,
  Heading,
  VStack,
  Text,
  Box,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
} from '@chakra-ui/react';
import { PiPlusBold } from 'react-icons/pi';
import { useFieldArray, useForm } from 'react-hook-form';

import { trpc } from '~/utils/trpc';
import { EditSecret, SecretToDelete } from './edit-secret';
import { useRef, useState } from 'react';
import { TITLE_COLUMN_MIN_WIDTH } from './constants';

type SecretsTabProps = {
  appId: string;
  editable: boolean;
};

const SecretsTab: React.FC<SecretsTabProps> = ({ appId, editable }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  const [secretToDelete, setSecretToDelete] = useState<SecretToDelete>();
  const utils = trpc.useContext();
  const { register, handleSubmit, reset, control } = useForm({
    defaultValues: {
      secrets: [{ key: '', value: '' }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control, // control props comes from useForm (optional: if you are using FormContext)
    name: 'secrets', // unique name for your Field Array
  });

  const existingSecrets = trpc.secret.all.useQuery({ appId });

  const addSecret = trpc.secret.add.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.secret.all.invalidate({ appId });
    },
  });

  const deleteSecret = trpc.secret.delete.useMutation({
    async onSuccess() {
      // refetches posts after a post is added
      await utils.secret.all.invalidate({ appId });
    },
  });

  const onSubmit = handleSubmit((data) => {
    data.secrets.map((secret: Record<'key' | 'value', string>) => {
      if (secret.key && secret.value) {
        addSecret.mutate({
          key: secret.key,
          value: secret.value,
          appId,
        });
      }
    });

    reset();
  });

  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack
        flex={1}
        alignItems="stretch"
        spacing={0}
        gap={4}
        minW={TITLE_COLUMN_MIN_WIDTH}
      >
        <Heading as="h6" fontWeight={400} flex={1}>
          Secrets
        </Heading>
        <Text display="inline">
          Use environment variables to provide secrets and environment
          information to your deployments. You can access them from your code by
          using the{' '}
          <Text as="span" display="inline" fontWeight="bold">
            Zipper.env
          </Text>{' '}
          API.
        </Text>
      </VStack>
      <VStack
        as="form"
        alignItems="stretch"
        onSubmit={onSubmit}
        flex={3}
        spacing={4}
      >
        <VStack align="stretch" pt={4} spacing={4}>
          {existingSecrets.data &&
            existingSecrets.data.map((secret) => (
              <EditSecret
                key={secret.id}
                existingSecret={secret}
                remove={(toDelete) => {
                  setSecretToDelete(toDelete);
                  onOpen();
                }}
                editable={editable}
              />
            ))}
          {editable &&
            fields.map((field, index) => (
              <EditSecret
                key={field.id}
                register={register}
                index={index}
                existingSecret={undefined}
                remove={remove}
              />
            ))}
          <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete secret
                </AlertDialogHeader>

                <AlertDialogBody>
                  Are you sure? You can't undo this action afterwards.
                </AlertDialogBody>

                <AlertDialogFooter>
                  <Button
                    ref={cancelRef}
                    onClick={() => {
                      setSecretToDelete(undefined);
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    colorScheme="red"
                    onClick={() => {
                      if (secretToDelete) {
                        deleteSecret.mutate({
                          appId: secretToDelete.appId,
                          id: secretToDelete.id,
                        });
                      }
                      setSecretToDelete(undefined);
                      onClose();
                    }}
                    ml={3}
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </VStack>

        <Box mt={4} pl={6}>
          {editable && (
            <Button
              variant="outline"
              mr={3}
              leftIcon={<PiPlusBold />}
              onClick={() => {
                append({
                  key: '',
                  value: '',
                });
              }}
            >
              Add Secret
            </Button>
          )}
          <Button type="submit" colorScheme="purple">
            {editable ? 'Save' : 'Close'}
          </Button>
        </Box>
      </VStack>
    </HStack>
  );
};

export default SecretsTab;
