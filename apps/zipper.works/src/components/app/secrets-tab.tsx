import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  HStack,
  IconButton,
  Input,
  Heading,
  VStack,
  useDisclosure,
  Text,
  Box,
} from '@chakra-ui/react';
import { AddIcon, CloseIcon, LockIcon } from '@chakra-ui/icons';
import { useFieldArray, useForm, UseFormRegister } from 'react-hook-form';
import { useRef, useState } from 'react';

import { trpc } from '~/utils/trpc';
import { FiTrash } from 'react-icons/fi';

type Props = {
  appId: string;
  editable: boolean;
};

const SecretsTab: React.FC<Props> = ({ appId, editable }) => {
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

  const existingSecrets = trpc.useQuery(['secret.all', { appId }]);

  const addSecret = trpc.useMutation('secret.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['secret.all', { appId }]);
    },
  });

  const deleteSecret = trpc.useMutation('secret.delete', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['secret.all', { appId }]);
    },
  });

  const Edit = ({
    register,
    index,
    existingSecret,
  }: {
    register?: UseFormRegister<any>;
    index?: number;
    existingSecret?: {
      key: string;
      id: string;
      appId: string;
    };
  }) => {
    const { isOpen, onOpen, onClose } = useDisclosure();
    const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

    const [secretToDelete, setSecretToDelete] = useState<{
      id: string;
      appId: string;
    }>();

    return (
      <>
        {!existingSecret && register && (
          <>
            <LockIcon />
            <Input
              placeholder="Key"
              {...register(`secrets.${index}.key`, {})}
            />
            <Input
              placeholder="Value"
              {...register(`secrets.${index}.value`, {})}
            />

            <IconButton
              variant="ghost"
              colorScheme="red"
              aria-label="delete"
              onClick={() => {
                remove(index);
              }}
            >
              <CloseIcon boxSize={3} />
            </IconButton>
          </>
        )}
        {existingSecret && (
          <>
            <LockIcon color={'gray.400'} />
            <Input placeholder="Key" disabled value={existingSecret.key} />
            <Input
              placeholder="Value"
              disabled
              type={'password'}
              value="we're not showing you this"
            />
            {editable && (
              <IconButton
                variant="ghost"
                colorScheme="red"
                aria-label="delete"
                onClick={() => {
                  setSecretToDelete(existingSecret);
                  onOpen();
                }}
              >
                <FiTrash />
              </IconButton>
            )}
          </>
        )}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Customer
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
      </>
    );
  };

  return (
    <>
      <form
        onSubmit={handleSubmit((data) => {
          console.log(data);
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
        })}
      >
        <Heading as="h6" pb="4" fontWeight={400}>
          Secrets
        </Heading>
        <VStack align={'start'}>
          <>
            <Box mb={4}>
              <Text display="inline">
                Use environment variables to provide secrets and environment
                information to your deployments. You can access them from your
                code by using the{' '}
                <Text as="span" display="inline" fontWeight="bold">
                  Zipper.env
                </Text>{' '}
                API.
              </Text>
            </Box>
            {existingSecrets.data &&
              existingSecrets.data.map((secret) => (
                <HStack key={secret.id}>
                  <Edit existingSecret={secret} />
                </HStack>
              ))}
            {register &&
              editable &&
              fields.map((field, index) => (
                <HStack key={field.id}>
                  <Edit register={register} index={index} />
                </HStack>
              ))}
          </>
        </VStack>

        <Box mt={4}>
          {editable && (
            <Button
              variant="outline"
              mr={3}
              onClick={() => {
                append({
                  key: '',
                  value: '',
                });
              }}
            >
              <AddIcon mr={2} boxSize={3} />
              Add Secret
            </Button>
          )}
          <Button type="submit" colorScheme="purple">
            {editable ? 'Save' : 'Close'}
          </Button>
        </Box>
      </form>
    </>
  );
};

export default SecretsTab;
