import {
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  StackDivider,
  Input,
  Spacer,
  Text,
  VStack,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';
import {
  ChangeEvent,
  Dispatch,
  MouseEventHandler,
  SetStateAction,
  useRef,
} from 'react';
import { HiOutlineTrash } from 'react-icons/hi';

export type SecretTextInputProps = {
  type: string;
  label: string;
  autoComplete: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

export function SecretTextInput({
  type,
  label,
  autoComplete,
  value,
  onChange,
}: SecretTextInputProps) {
  return (
    <FormControl>
      <FormLabel color={'fg.500'}>{label}</FormLabel>
      <Input
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        type={type}
      />
    </FormControl>
  );
}

export type ConnectorInputFormProps = {
  zendeskSubdomain: string;
  zendeskAppID: string;
  zendeskEmail: string;
  zendeskToken: string;
  isSaving: boolean;
  setZendeskAppID: Dispatch<SetStateAction<string>>;
  setZendeskSubdomain: Dispatch<SetStateAction<string>>;
  setZendeskEmail: Dispatch<SetStateAction<string>>;
  setZendeskToken: Dispatch<SetStateAction<string>>;
  handleSave: MouseEventHandler<HTMLButtonElement>;
};

export function ConnectorInputForm({
  zendeskSubdomain,
  zendeskAppID,
  zendeskEmail,
  zendeskToken,
  isSaving,
  setZendeskAppID,
  setZendeskSubdomain,
  setZendeskEmail,
  setZendeskToken,
  handleSave,
}: ConnectorInputFormProps) {
  return (
    <Card w="full">
      <CardBody color="fg.600">
        <VStack align="stretch">
          <Heading size="sm">Configuration</Heading>
          <SecretTextInput
            type="text"
            label="Zendesk Subdomain"
            autoComplete="new-subdomain"
            value={zendeskSubdomain}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setZendeskSubdomain(e.target.value)
            }
          />
          <SecretTextInput
            type="text"
            label="Zendesk App ID"
            autoComplete="new-app-id"
            value={zendeskAppID}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setZendeskAppID(e.target.value)
            }
          />
          <SecretTextInput
            type="text"
            label="Zendesk Email"
            autoComplete="new-email"
            value={zendeskEmail}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setZendeskEmail(e.target.value)
            }
          />
          <SecretTextInput
            type="password"
            label="Zendesk Token"
            autoComplete="new-token"
            value={zendeskToken}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setZendeskToken(e.target.value)
            }
          />
          <Button
            mt="6"
            colorScheme={'purple'}
            isDisabled={isSaving}
            onClick={handleSave}
          >
            Save & Install
          </Button>
        </VStack>
      </CardBody>
    </Card>
  );
}

export type ConnectorUninstallFormProps = {
  handleUninstall: MouseEventHandler<HTMLButtonElement>;
  isSaving: boolean;
};

export function ConnectorUninstallForm({
  handleUninstall,
  isSaving,
}: ConnectorUninstallFormProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;
  return (
    <>
      <Card w="full" gap={2}>
        <CardBody color="fg.600">
          <VStack align="start">
            <Heading size="sm">Configuration</Heading>
            <HStack w="full" pt="2" spacing="1">
              <FormLabel m="0">Installed!</FormLabel>
              <Spacer />
              <Button variant="unstyled" color="red.600" onClick={onOpen}>
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
                onClick={(e) => {
                  handleUninstall(e);
                  console.log('UNINSTALLED!!!');
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
  );
}

export function ConnectorInEditableForm() {
  return (
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
  );
}
