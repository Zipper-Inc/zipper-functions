import {
  Button,
  Input,
  Heading,
  VStack,
  Box,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Icon,
  InputGroup,
  InputRightElement,
  Textarea,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';

import { inferQueryOutput, trpc } from '~/utils/trpc';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from 'slugify';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';

type Props = {
  app: Pick<
    Unpack<inferQueryOutput<'app.byId'>>,
    'id' | 'name' | 'slug' | 'description'
  >;
};

const SettingsTab: React.FC<Props> = ({ app }) => {
  const appQuery = trpc.useQuery(['app.byId', { id: app.id }]);
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess() {
      appQuery.refetch();
    },
  });

  const [slug, setSlug] = useState<string>(app.slug || '');
  const { slugExists: _slugExists } = useAppSlug(slug);

  const settingsForm = useForm({
    defaultValues: {
      name: app.name,
      slug: app.slug,
      description: app.description,
    },
  });
  const model = settingsForm.watch();

  useEffect(() => {
    setSlug(slugify(model.slug));
  }, [model.slug]);

  const didModelChange = () => {
    return (
      slug !== appQuery.data?.slug ||
      model.name !== appQuery.data?.name ||
      model.description !== appQuery.data?.description
    );
  };

  const slugExists = slug === appQuery.data?.slug ? false : _slugExists;
  const disableSave =
    slugExists || slug.length < MIN_SLUG_LENGTH || !didModelChange();

  return (
    <FormProvider {...settingsForm}>
      <form
        onSubmit={settingsForm.handleSubmit(async (data) => {
          appEditMutation.mutateAsync({
            id: app.id,
            data: {
              slug: data.slug,
              description: data.description,
            },
          });
        })}
      >
        <Heading as="h6" pb="4" fontWeight={400}>
          Settings
        </Heading>
        <VStack align={'start'} gap={2}>
          <FormControl isRequired>
            <FormLabel>Slug</FormLabel>
            <InputGroup>
              <Input
                backgroundColor="white"
                maxLength={60}
                {...settingsForm.register('slug')}
              />
              {slug && slug.length >= MIN_SLUG_LENGTH && (
                <InputRightElement
                  children={
                    slugExists ? (
                      <Icon as={HiExclamationTriangle} color="red.500" />
                    ) : (
                      <CheckIcon color="green.500" />
                    )
                  }
                />
              )}
            </InputGroup>
            {settingsForm.watch('slug') && (
              <FormHelperText>
                {`Your app will be available at
                            ${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`}
              </FormHelperText>
            )}
            <FormErrorMessage>
              {settingsForm.formState.errors.slug?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel>Name</FormLabel>
            <Input
              backgroundColor="white"
              maxLength={60}
              {...settingsForm.register('name')}
            />
            <FormErrorMessage>
              {settingsForm.formState.errors.name?.message}
            </FormErrorMessage>
          </FormControl>
          <FormControl>
            <FormLabel textColor="gray.600">Description</FormLabel>
            <Textarea
              backgroundColor="white"
              {...settingsForm.register('description')}
            />
          </FormControl>
          <Box w="full">
            <Button
              ml="auto"
              display="block"
              colorScheme="purple"
              type="submit"
              isDisabled={disableSave}
            >
              Save
            </Button>
          </Box>
        </VStack>
      </form>
    </FormProvider>
  );
};

export default SettingsTab;
