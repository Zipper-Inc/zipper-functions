import createConnector from '../createConnector';
import {
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  Input,
  InputProps,
  Text,
  VStack,
} from '@chakra-ui/react';
import { FiDatabase } from 'react-icons/fi';
import { trpc } from '~/utils/trpc';
import { code } from './constants';
import { useForm } from 'react-hook-form';

// configure the Slack connectorAl
export const postgresConnector = createConnector({
  id: 'postgres',
  name: 'Postgres',
  description: `Connect to a Postgres database and run queries.`,
  icon: <FiDatabase fill="black" />,
  code,
});

function PostgresConnectorForm({ appId }: { appId: string }) {
  if (!postgresConnector) {
    return null;
  }

  return (
    <Box px="6" w="full">
      <Box mb="5">
        <Heading size="md">{postgresConnector.name} Connector</Heading>
      </Box>
      <VStack align="start">
        <Card w="full">
          <CardBody color="fg.600">
            <VStack align="start" w="full" overflow="visible">
              <Heading size="sm">Configuration</Heading>
              <Form appId={appId} />
            </VStack>
          </CardBody>
        </Card>
      </VStack>
      <Text mt="10" color="fg.600">
        Connector code:
      </Text>
    </Box>
  );
}
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
const Form = ({ appId }: { appId: string }) => {
  const secretMutation = trpc.secret.add.useMutation();
  const { handleSubmit, register } = useForm<PostgresForm>({});

  const onSubmit = (data: PostgresForm) => {
    const entries = Object.entries(data);
    for (const [key, value] of entries) {
      secretMutation.mutate({
        appId,
        key,
        value,
      });
    }
  };

  return (
    <Box as={'form'} w="full" onSubmit={handleSubmit(onSubmit)}>
      <VStack w="full" py={'2'}>
        {inputs.map((input) => (
          <FormControl key={input.name}>
            <FormLabel color={'fg.500'}>{input.formLabel}</FormLabel>
            <Input
              w={'full'}
              autoComplete={input.name}
              {...register(input.name)}
              {...input}
            />
          </FormControl>
        ))}
      </VStack>
      <Button mt="2" colorScheme={'purple'} type="submit">
        Save & Install
      </Button>
    </Box>
  );
};
export default PostgresConnectorForm;
