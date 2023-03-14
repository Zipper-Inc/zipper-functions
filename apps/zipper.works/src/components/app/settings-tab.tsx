import {
  Button,
  Input,
  Heading,
  VStack,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Icon,
  InputGroup,
  InputRightElement,
  Textarea,
  useToast,
  HStack,
  Text,
} from '@chakra-ui/react';
import { CheckIcon } from '@chakra-ui/icons';
import { FormProvider, useForm } from 'react-hook-form';
import { useEffect, useState } from 'react';

import { inferQueryOutput, trpc } from '~/utils/trpc';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from 'slugify';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { useRouter } from 'next/router';

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
  const router = useRouter();
  const [slug, setSlug] = useState<string>(app.slug || '');
  const { slugExists: _slugExists } = useAppSlug(slug);
  const toast = useToast();

  const settingsForm = useForm({
    defaultValues: {
      name: app.name ?? '',
      slug: app.slug,
      description: app.description,
    },
  });
  const model = settingsForm.watch();

  useEffect(() => {
    settingsForm.setValue('slug', app.slug);
  }, [app.slug]);

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

  const onSubmit = settingsForm.handleSubmit(async (data) => {
    const oldSlug = app.slug;
    const duration = 3000;
    appEditMutation.mutateAsync(
      {
        id: app.id,
        data: {
          slug: data.slug,
          name: data.name,
          description: data.description,
        },
      },
      {
        onSuccess: (app) => {
          let description = undefined;
          if (app.slug !== oldSlug) {
            const url = router.asPath.replace(oldSlug, app.slug);
            setTimeout(() => {
              router.replace(url);
            }, duration / 2);
            description = 'Your page will reload';
          }
          toast({
            title: 'App updated.',
            status: 'success',
            duration,
            description,
            isClosable: true,
          });
        },
        onError: () => {
          toast({
            title: 'Error.',
            status: 'error',
            description: 'Could not update the app',
            duration,
            isClosable: true,
          });
        },
      },
    );
  });

  const slugExists = slug === appQuery.data?.slug ? false : _slugExists;
  const disableSave =
    slugExists || slug.length < MIN_SLUG_LENGTH || !didModelChange();
  const appLink = `${slug}.${process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}`;

  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack flex={1} alignItems="stretch">
        <Heading as="h6" pb="4" fontWeight={400}>
          Settings
        </Heading>
      </VStack>
      <FormProvider {...settingsForm}>
        <VStack
          as="form"
          onSubmit={onSubmit}
          flex={3}
          align="stretch"
          spacing={9}
        >
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
            <FormHelperText display="flex" gap={2} fontSize="sm">
              <Text fontWeight="semibold">Required</Text>
              {settingsForm.watch('slug') && (
                <Text>Your app will be available at {appLink}</Text>
              )}
            </FormHelperText>
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
          <FormControl>
            <Button
              display="block"
              colorScheme="purple"
              type="submit"
              isDisabled={disableSave}
            >
              Save
            </Button>
          </FormControl>
        </VStack>
      </FormProvider>
    </HStack>
  );
};

export default SettingsTab;
