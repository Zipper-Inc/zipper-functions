import {
  useToast,
  FormControl,
  HStack,
  Input,
  Button,
  FormHelperText,
  Box,
  Text,
  InputRightElement,
  InputGroup,
  Icon,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { HiCheck, HiPlus } from 'react-icons/hi';
import { HiExclamationTriangle } from 'react-icons/hi2';
import slugify from 'slugify';
import { MIN_SLUG_LENGTH, useAppSlug } from '~/hooks/use-app-slug';
import { AppQueryOutput } from '~/types/trpc';
import { trpc } from '~/utils/trpc';
import { useEditorContext } from '../context/editor-context';

type EditAppSlugFormProps = { app: AppQueryOutput; onClose: VoidFunction };
export const EditAppSlugForm: React.FC<EditAppSlugFormProps> = ({
  app,
  onClose,
}) => {
  const appSlugForm = useForm({ defaultValues: { slug: app.slug } });
  const router = useRouter();
  const appEditMutation = trpc.useMutation('app.edit', {
    onSuccess({ slug }) {
      if (slug !== app.slug) {
        const url = router.asPath.replace(app.slug, slug);
        router.replace(url);
      }
    },
  });
  const toast = useToast();
  const { refetchApp } = useEditorContext();
  const slug = slugify(appSlugForm.watch('slug'));
  const { slugExists: _slugExists } = useAppSlug(slug);
  const slugExists = slug === app.slug ? false : _slugExists;
  const disableSave =
    slugExists || slug.length < MIN_SLUG_LENGTH || app.slug === slug;

  const onSubmit = appSlugForm.handleSubmit((data) => {
    const duration = 3000;
    appEditMutation.mutateAsync(
      { id: app.id, data },
      {
        onSuccess: (updatedApp) => {
          const url = router.asPath.replace(app.slug, updatedApp.slug);
          toast({
            title: 'App slug updated.',
            status: 'success',
            duration,
            description: 'Your page will reload',
            isClosable: true,
          });
          onClose();
          setTimeout(() => {
            router.replace(url);
            refetchApp();
          }, duration / 2);
        },
        onError: () => {
          toast({
            title: 'Error.',
            status: 'error',
            duration,
            description: 'Could not update the app slug',
            isClosable: true,
          });
        },
      },
    );
  });

  return (
    <form onSubmit={onSubmit}>
      <FormControl position="relative">
        <HStack>
          <InputGroup>
            <Input size="md" type="text" {...appSlugForm.register('slug')} />
            {slug && slug.length >= MIN_SLUG_LENGTH && (
              <InputRightElement
                children={
                  slugExists ? (
                    <Icon as={HiExclamationTriangle} color="red.500" />
                  ) : (
                    <Icon as={HiCheck} color="green.500" />
                  )
                }
              />
            )}
          </InputGroup>
          <HStack spacing={0}>
            <Button
              type="submit"
              colorScheme="purple"
              variant="ghost"
              size="sm"
              isDisabled={disableSave}
            >
              <Text fontSize="xs">Update</Text>
            </Button>
            <Button
              variant="ghost"
              rounded="full"
              size="sm"
              p={0}
              onClick={onClose}
            >
              <Box transform="rotate(45deg)" color="gray.600">
                <HiPlus />
              </Box>
            </Button>
          </HStack>
        </HStack>
        {!disableSave && (
          <FormHelperText
            position="absolute"
            backgroundColor="white"
            width="fit-content"
            whiteSpace="nowrap"
            padding="8px"
            zIndex={1}
            border="1px solid"
            borderColor="gray.300"
            rounded="md"
          >
            {'Your app will now be available at '}
            <Text display="inline" fontWeight="semibold">
              {slug}
            </Text>
            .{process.env.NEXT_PUBLIC_OUTPUT_SERVER_HOSTNAME}
          </FormHelperText>
        )}
      </FormControl>
    </form>
  );
};
