import { useRef } from 'react';
import {
  Box,
  Flex,
  Input,
  Switch,
  Textarea,
  Heading,
  FormLabel,
  Badge,
  VStack,
  HStack,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  useDisclosure,
} from '@chakra-ui/react';
import { VscAdd } from 'react-icons/vsc';
import { FieldValues, UseFormReturn, RegisterOptions } from 'react-hook-form';
import { InputType, InputParam } from '@zipper/types';
import { getFieldName } from '../utils/form';

interface Props {
  params: InputParam[];
  defaultValues?: any;
  formContext: UseFormReturn<FieldValues, any>;
}

/*
const withOptional =
  (InnerComponent: (props: any) => ReactElement) => (componentProps: any) => {
    const [isDefined, setIsDefined] = useState(false);
    return (
      <Box opacity={!isDefined ? '50%' : '100%'}>
        {!isDefined && <Button onClick={() => setIsDefined(true)}>+</Button>}
        <InnerComponent {...componentProps} />
        isDefined && <Button onClick={() => setIsDefined(true)}>+</Button>}
      </Box>
    );
  };
*/

function FunctionParamInput({
  inputKey,
  type,
  optional,
  formContext,
}: {
  inputKey: string;
  type: InputType;
  optional: boolean;
  value: any;
  formContext: Props['formContext'];
}) {
  const { register } = formContext;
  const name = getFieldName(inputKey, type);
  const formFieldOptions: RegisterOptions<FieldValues, string> = {
    required: !optional,
  };

  if (type === InputType.number) {
    formFieldOptions.valueAsNumber = true;
  } else if (type === InputType.date) {
    formFieldOptions.valueAsDate = true;
  }

  const formProps = register(name, formFieldOptions);

  switch (type) {
    case InputType.boolean: {
      return <Switch colorScheme="purple" {...formProps} />;
    }

    case InputType.string: {
      return (
        <Textarea
          backgroundColor="white"
          fontFamily="monospace"
          fontSize="smaller"
          minHeight={14}
          {...formProps}
        />
      );
    }

    case InputType.number: {
      return (
        <NumberInput width="full">
          <NumberInputField
            backgroundColor="white"
            fontFamily="monospace"
            fontSize="smaller"
            {...formProps}
          />
          <NumberInputStepper>
            <NumberIncrementStepper />
            <NumberDecrementStepper />
          </NumberInputStepper>
        </NumberInput>
      );
    }

    case InputType.date: {
      return <Input backgroundColor="white" type="date" {...formProps} />;
    }

    case InputType.array:
    case InputType.object:
    case InputType.any:
    default: {
      return (
        <Textarea
          backgroundColor="white"
          fontFamily="monospace"
          fontSize="smaller"
          minHeight={90}
          defaultValue={type === InputType.array ? '[]' : '{}'}
          {...formProps}
        />
      );
    }
  }
}

function SingleInput({
  name,
  type,
  optional,
  formContext,
}: {
  name: string;
  type: InputType;
  optional: boolean;
  formContext: UseFormReturn<FieldValues, any>;
}): JSX.Element {
  const formName = getFieldName(name, type);
  const { isOpen, onOpen, onClose } = useDisclosure({
    defaultIsOpen: !optional,
  });
  const lastValue = useRef<any>(formContext.getValues()[formName]);

  const open = () => {
    formContext.setValue(formName, lastValue.current);
    onOpen();
  };

  const close = () => {
    lastValue.current = formContext.getValues()[formName];
    formContext.setValue(formName, undefined);
    onClose();
  };

  return (
    <Box width="100%" position="relative">
      <FormLabel my="2" mx={0}>
        <VStack justify="start" align="start" spacing={1.5}>
          <HStack spacing={2} align="center" width="full" paddingRight={8}>
            <Heading
              size="sm"
              fontWeight="medium"
              ml={0.5}
              mr={2}
              alignSelf="center"
              opacity={!isOpen ? '50%' : '100%'}
            >
              {name}
            </Heading>
            <Box mt={1} opacity={!isOpen ? '50%' : '100%'}>
              <Badge
                variant="subtle"
                colorScheme="purple"
                fontSize="xs"
                fontWeight="medium"
                rounded="full"
                py="0.5"
                px={2}
              >
                {type}
              </Badge>
            </Box>
            {optional && (
              <>
                <Box mt={1}>
                  <Badge variant="subtle" color="gray.400" fontSize=".6rem">
                    {!isOpen ? 'Optional' : 'Included'}
                  </Badge>
                </Box>
              </>
            )}
          </HStack>
          {isOpen && (
            <Flex width="100%">
              <FunctionParamInput
                inputKey={name}
                type={type}
                value={null}
                optional={optional}
                formContext={formContext}
              />
            </Flex>
          )}
        </VStack>
      </FormLabel>
      {optional && (
        <Flex
          position="absolute"
          right={0}
          left={!isOpen ? 0 : undefined}
          top={0}
          height={10}
          alignItems="center"
          justifyContent="end"
        >
          <Button
            display="flex"
            alignItems="center"
            justifyContent="end"
            name={!isOpen ? 'Add input' : 'Remove input'}
            variant="unstyled"
            _hover={{
              color: 'purple.500',
            }}
            size="xs"
            mt="2px"
            p={1}
            height={6}
            width={!isOpen ? 'full' : 6}
            onClick={!isOpen ? open : close}
          >
            <Box
              transition="all 100ms ease-in-out"
              transform={!isOpen ? 'rotate(0deg)' : 'rotate(45deg)'}
            >
              <VscAdd />
            </Box>
          </Button>
        </Flex>
      )}
    </Box>
  );
}

export function FunctionInputs({ params = [], formContext }: Props) {
  const inputs = params.map(({ key: name, type, optional }, i) => (
    <SingleInput
      key={`${name}--${i}`}
      name={name}
      type={type}
      optional={optional}
      formContext={formContext}
    />
  ));

  return inputs.length ? (
    <VStack px={1} spacing={1}>
      {inputs}
    </VStack>
  ) : (
    <Textarea
      backgroundColor="white"
      fontFamily="monospace"
      fontSize="smaller"
      minHeight={90}
      defaultValue="{}"
      {...formContext.register('params')}
    />
  );
}
