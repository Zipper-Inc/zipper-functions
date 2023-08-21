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
  Link,
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
  function validateForm() {
    return (
      !!zendeskSubdomain && !!zendeskAppID && !!zendeskEmail && !!zendeskToken
    );
  }
  return (
    <VStack align="start" w="full">
      <Card w="full">
        <CardBody color="fg.600">
          <VStack align="start" w="full" overflow="visible" spacing="4">
            <FormControl>
              <FormLabel>Zendesk Subdomain</FormLabel>
              <Input
                type="text"
                value={zendeskSubdomain}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setZendeskSubdomain(e.target.value)
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Zendesk App ID</FormLabel>
              <Input
                type="text"
                value={zendeskAppID}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setZendeskAppID(e.target.value)
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Zendesk Email</FormLabel>
              <Input
                type="text"
                value={zendeskEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setZendeskEmail(e.target.value)
                }
              />
            </FormControl>
            <FormControl>
              <FormLabel>Zendesk Token</FormLabel>
              <Input
                type="password"
                value={zendeskToken}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setZendeskToken(e.target.value)
                }
              />
            </FormControl>
            <Button
              mt="6"
              colorScheme={'purple'}
              isDisabled={isSaving || !validateForm()}
              onClick={handleSave}
            >
              Save & Install
            </Button>
            <Text mt="10" color="fg.600">
              After saving, you can use the Zendesk connector in your app.
            </Text>
            <ConnectorInstructions />
          </VStack>
        </CardBody>
      </Card>
    </VStack>
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
            <br />
            <ConnectorInstructions />
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
              Uninstall Zendesk Connector
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

export type ConnectorInEditableFormProps = {
  zendeskSubdomain: string;
  zendeskAppId: string;
  zendeskEmail: string;
};

export function ConnectorInEditableForm({
  zendeskSubdomain,
  zendeskAppId,
  zendeskEmail,
}: ConnectorInEditableFormProps) {
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
          <HStack>
            <Text as="b">Zendesk Subdomain:</Text>
            <Text>{zendeskSubdomain}</Text>
          </HStack>
          <HStack>
            <Text as="b">Zendesk App ID:</Text>
            <Text>{zendeskAppId}</Text>
          </HStack>
          <HStack>
            <Text as="b">Zendesk Email:</Text>
            <Text>{zendeskEmail}</Text>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  );
}

export function ConnectorInstructions() {
  return (
    <VStack align="start">
      <text>
        For more information on how to embed your Zipper app in Zendesk see the
        Zipper docs:{' '}
        <Link
          color="purple.600"
          href="https://www.notion.so/zipper-inc/Zendesk-Apps-in-Zipper-5a526ad14bf5414da9ed4968f94568b6"
          isExternal
        >
          <b>Embed Zipper in Zendesk</b>
        </Link>
      </text>
    </VStack>
  );
}