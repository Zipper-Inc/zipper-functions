import {
  Heading,
  VStack,
  FormErrorMessage,
  FormLabel,
  Input,
  Button,
  FormControl,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';
import { Script } from '@prisma/client';

export default function AddScriptForm({
  appId,
  scripts,
}: {
  appId: string;
  scripts: Script[];
}) {
  const { register, handleSubmit, reset } = useForm();
  const utils = trpc.useContext();
  const addScript = trpc.useMutation('script.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['script.byAppId', { appId }]);
      reset();
    },
  });

  return (
    <>
      <Heading size="md" marginBottom={4}>
        Create a function
      </Heading>
      <form
        onSubmit={handleSubmit(
          ({ name, description, code = '// Here we go!' }) => {
            addScript.mutateAsync({
              name,
              description,
              code: code,
              appId,
              order: scripts.length,
            });
          },
        )}
        style={{ display: 'block', width: '100%' }}
      >
        {addScript.error && (
          <FormErrorMessage>{addScript.error.message}</FormErrorMessage>
        )}
        <VStack align={'start'}>
          <FormControl>
            <FormLabel>Name:</FormLabel>
            <Input
              size="md"
              type="text"
              disabled={addScript.isLoading}
              {...register('name')}
            />
          </FormControl>
          <FormControl>
            <FormLabel>Description:</FormLabel>
            <Input
              size="md"
              type="text"
              disabled={addScript.isLoading}
              {...register('description')}
            />
          </FormControl>
          <Button
            type="submit"
            paddingX={6}
            disabled={addScript.isLoading}
            bgColor="purple.800"
            textColor="gray.100"
          >
            Submit
          </Button>
        </VStack>
      </form>
    </>
  );
}
