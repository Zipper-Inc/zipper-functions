import {
  useToast,
  FormControl,
  HStack,
  Input,
  Button,
  FormHelperText,
  Box,
  Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { VscSave, VscChromeClose } from 'react-icons/vsc';
import slugify from 'slugify';
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
          <Input size="md" type="text" {...appSlugForm.register('slug')} />
          <HStack spacing={0}>
            <Button
              type="submit"
              colorScheme="purple"
              variant="ghost"
              rounded="3xl"
              size="sm"
              p={0}
            >
              <Box>
                <VscSave />
              </Box>
            </Button>
            <Button
              variant="ghost"
              rounded="3xl"
              size="sm"
              p={0}
              onClick={onClose}
            >
              <Box>
                <VscChromeClose />
              </Box>
            </Button>
          </HStack>
        </HStack>
        {slug && slug !== app.slug && (
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
