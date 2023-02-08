import { CheckIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Icon,
  Textarea,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { HiExclamationTriangle } from 'react-icons/hi2';
import { useDebounce } from 'use-debounce';
import slugify from '~/utils/slugify';
import { trpc } from '~/utils/trpc';
import { generateDefaultName } from '~/utils/generate-default';

const MIN_SLUG_LENGTH = 5;

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

const getDefaultCreateAppFormValues = () => ({
  name: generateDefaultName(),
  description: '',
});

export const CreateAppModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const utils = trpc.useContext();
  const addApp = trpc.useMutation('app.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byAuthedUser']);
    },
  });

  const [slugExists, setSlugExists] = useState<boolean | undefined>(false);
  const [slug, setSlug] = useState<string>(() => generateDefaultName());
  const [debouncedSlug] = useDebounce(slug, 200);

  const appSlugQuery = trpc.useQuery(
    ['app.validateSlug', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length >= MIN_SLUG_LENGTH) },
  );

  const createAppForm = useForm({
    defaultValues: getDefaultCreateAppFormValues(),
  });

  useEffect(() => {
    setSlugExists(appSlugQuery.data);
  }, [appSlugQuery.data]);

  const resetForm = () => {
    const defaultValue = getDefaultCreateAppFormValues();
    createAppForm.reset(defaultValue);
    setSlug(slugify(defaultValue.name));
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          resetForm();
          onClose();
        }}
        size="xl"
      >
        <FormProvider {...createAppForm}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>New App</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack align={'start'} gap={2}>
                <FormControl isRequired>
                  <FormLabel>Name</FormLabel>
                  <InputGroup>
                    <Input
                      backgroundColor="white"
                      maxLength={60}
                      {...createAppForm.register('name')}
                      onChange={(e) => {
                        setSlug(slugify(e.target.value));
                      }}
                    />
                    {appSlugQuery.isFetched &&
                      slug &&
                      slug.length >= MIN_SLUG_LENGTH && (
                        <InputRightElement
                          children={
                            slugExists ? (
                              <Icon
                                as={HiExclamationTriangle}
                                color="red.500"
                              />
                            ) : (
                              <CheckIcon color="green.500" />
                            )
                          }
                        />
                      )}
                  </InputGroup>
                  {createAppForm.watch('name') && (
                    <FormHelperText>
                      {`Your app will be available at
                            ${slugify(slug)}.${
                        process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME
                      }`}
                    </FormHelperText>
                  )}
                  <FormErrorMessage>
                    {createAppForm.formState.errors.name?.message}
                  </FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel textColor="gray.600">Description</FormLabel>
                  <Textarea
                    backgroundColor="white"
                    {...createAppForm.register('description')}
                  />
                </FormControl>
                <Box w="full">
                  <Button
                    ml="auto"
                    display="block"
                    colorScheme="purple"
                    type="submit"
                    isDisabled={slugExists || slug.length < MIN_SLUG_LENGTH}
                    onClick={createAppForm.handleSubmit(async (data) => {
                      await addApp.mutateAsync(data, {
                        onSuccess: () => {
                          resetForm();
                          onClose();
                        },
                      });
                    })}
                  >
                    Create
                  </Button>
                </Box>
              </VStack>
            </ModalBody>
            <ModalFooter />
          </ModalContent>
        </FormProvider>
      </Modal>
    </>
  );
};
