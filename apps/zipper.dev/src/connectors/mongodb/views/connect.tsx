import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
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
  LABEL: `MongoDB database connection`,
  DESCRIPTION: 'Add your MongoDB configuration.',
};

type MongoInputsNames = 'MONGO_CONNECTION_STRING';

type MongoInputs = {
  formLabel: string;
  name: MongoInputsNames;
} & InputProps;

type PostgresForm = Record<MongoInputs['name'], string>;

const inputs: MongoInputs[] = [
  { formLabel: 'Connection String', name: 'MONGO_CONNECTION_STRING' },
];

/* -------------------------------------------- */
/* Main                                         */
/* -------------------------------------------- */

const MongoConnect: React.FC<{ appId: string }> = ({ appId }) => {
  /* ------------------ States ------------------ */
  const [isSubmiting, setIsSubmiting] = useState<null | string>(null);
  const [isTestingConnection, setIsTestingConnection] = useState<null | string>(
    null,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ------------------- Hooks ------------------ */
  const { handleSubmit, register, getValues } = useForm<PostgresForm>({});
  const context = trpc.useContext();
  const router = useRouter();

  /* ----------------- Mutations ---------------- */
  const addSecretMutation = trpc.secret.add.useMutation({
    async onSuccess() {
      context.secret.get.invalidate({
        appId,
        key: ['MONGO_CONNECTION_STRING'],
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

  const testConnection = async () => {
    setIsTestingConnection('Testing');
    const formData = getValues();

    // Construct connection string or use individual parts
    const connectionString = `${formData.MONGO_CONNECTION_STRING}?sslmode=require`;

    try {
      const response = await fetch('/api/testConnection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionString }),
      });

      const result = await response.json();

      if (response.ok) {
        setIsTestingConnection('Connected!');
        setErrorMessage(null);
      } else {
        setIsTestingConnection(result.message);
        setErrorMessage(result.message);
      }
    } catch (error: any) {
      setIsTestingConnection(error.message);
    }
  };

  const connectionStatus =
    isTestingConnection === 'Connected!' ? 'success' : 'error';
  const connectionMessage =
    isTestingConnection === 'Connected!'
      ? 'Connection successfull!'
      : errorMessage;

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
          <HStack w="full">
            <Button
              colorScheme="blue"
              isLoading={isTestingConnection === 'Testing'}
              loadingText={isTestingConnection!}
              disabled={!!isTestingConnection}
              onClick={() => testConnection()}
            >
              Test Connection
            </Button>

            <Button
              colorScheme="purple"
              isLoading={!!isSubmiting}
              loadingText={isSubmiting!}
              isDisabled={!!isSubmiting || isTestingConnection !== 'Connected!'}
              type="submit"
            >
              Save & Install
            </Button>
          </HStack>
          {isTestingConnection && isTestingConnection !== 'Testing' && (
            <Alert status={connectionStatus}>
              <AlertIcon />
              <AlertTitle mr={2}>{connectionMessage}</AlertTitle>
              <AlertDescription>
                {connectionMessage === 'Connection successfull!'
                  ? 'You can now install the connector.'
                  : 'Please check your connection details and try again.'}
              </AlertDescription>
            </Alert>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};

export default MongoConnect;
