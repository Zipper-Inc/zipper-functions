import {
  Button,
  Card,
  CardBody,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Input,
  InputProps,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { trpc } from '~/utils/trpc';

/* -------------------------------------------- */
/* Constants                                    */
/* -------------------------------------------- */
const CLIENT_ID_FORM = {
  LABEL: `Postgres database connection`,
  DESCRIPTION: 'Add your postgres database configuration.',
};

type PostgresInputsNames =
  | 'POSTGRES_HOST'
  | 'POSTGRES_PORT'
  | 'POSTGRES_USER'
  | 'POSTGRES_DATABASE'
  | 'POSTGRES_PASSWORD';
type PostgresInputs = {
  formLabel: string;
  name: PostgresInputsNames;
} & InputProps;
type PostgresForm = Record<PostgresInputs['name'], string>;

const inputs: PostgresInputs[] = [
  { formLabel: 'Host', name: 'POSTGRES_HOST' },
  { formLabel: 'Port', name: 'POSTGRES_PORT' },
  { formLabel: 'User', name: 'POSTGRES_USER' },
  { formLabel: 'Database', name: 'POSTGRES_DATABASE' },
  { formLabel: 'Password', name: 'POSTGRES_PASSWORD', type: 'password' },
];

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const PostgresConnect: React.FC<{ appId: string }> = ({ appId }) => {
  /* ------------------ States ------------------ */
  const [isSubmiting, setIsSubmiting] = useState<null | string>(null);

  /* ------------------- Hooks ------------------ */
  const { handleSubmit, register } = useForm<PostgresForm>({});
  const context = trpc.useContext();
  const router = useRouter();

  /* ----------------- Mutations ---------------- */
  const addSecretMutation = trpc.secret.add.useMutation({
    async onSuccess() {
      context.secret.get.invalidate({
        appId,
        key: [
          'POSTGRES_HOST',
          'POSTGRES_USER',
          'POSTGRES_DATABASE',
          'POSTGRES_PORT',
          'POSTGRES_PASSWORD',
        ],
      });
    },
  });

  const updateAppConnectorMutation = trpc.appConnector.update.useMutation({
    onSuccess: () => {
      context.app.byResourceOwnerAndAppSlugs.invalidate({
        appSlug: router.query['app-slug'] as string,
        resourceOwnerSlug: router.query['resource-owner'] as string,
      });
    },
  });

  /* ----------------- Callbacks ---------------- */
  const onSubmit = async (data: PostgresForm) => {
    setIsSubmiting('Saving');
    const entries = Object.entries(data);
    const mutationPromises = entries.map(([key, value]) =>
      addSecretMutation.mutateAsync({
        appId,
        key,
        value,
      }),
    );
    await Promise.all([
      updateAppConnectorMutation.mutateAsync({
        appId,
        type: 'postgres',
        data: { isUserAuthRequired: false },
      }),
      ...mutationPromises,
    ]);

    return setIsSubmiting(null);
  };

  /* ------------------ Render ------------------ */
  return (
    <Card w="full">
      <CardBody color="fg.600">
        <VStack
          as="form"
          align="start"
          w="full"
          overflow="visible"
          onSubmit={handleSubmit(onSubmit)}
        >
          <Heading size="sm">Configuration</Heading>
          <HStack pt="4" pb="4" w="full">
            <FormControl>
              <FormHelperText maxW="xl" mb="2">
                {CLIENT_ID_FORM.DESCRIPTION}
              </FormHelperText>
              {inputs.map((input) => (
                <FormControl>
                  <FormLabel color={'fg.500'}>{input.formLabel}</FormLabel>
                  <Input
                    w={'full'}
                    autoComplete="new-password"
                    spellCheck="false"
                    {...register(input.name)}
                    {...input}
                  />
                </FormControl>
              ))}
            </FormControl>
          </HStack>
          <Button
            mt="6"
            colorScheme="purple"
            isLoading={!!isSubmiting}
            loadingText={isSubmiting!}
            disabled={!!isSubmiting}
            type="submit"
          >
            Save & Install
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
};

export default PostgresConnect;
