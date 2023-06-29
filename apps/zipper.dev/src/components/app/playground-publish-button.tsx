import {
  HStack,
  IconButton,
  Tooltip,
  Text,
  Link,
  useClipboard,
  useToast,
  UnorderedList,
  ListItem,
  Button,
} from '@chakra-ui/react';
import { HiOutlineClipboard, HiOutlineUpload } from 'react-icons/hi';
import { getAppLink } from '@zipper/utils';
import { useEditorContext } from '../context/editor-context';
import { AppQueryOutput } from '~/types/trpc';
import { trpc } from '~/utils/trpc';
import { useRunAppContext } from '../context/run-app-context';

export const PlaygroundPublishButton = ({ app }: { app: AppQueryOutput }) => {
  const appLink = getAppLink(app.slug);
  const publishApp = trpc.useMutation('app.publish');

  const { save, currentScript, editorHasErrors, getErrorFiles } =
    useEditorContext();
  const toast = useToast();

  const { boot } = useRunAppContext();

  const { onCopy } = useClipboard(
    `${appLink}${
      currentScript?.filename === 'main.ts'
        ? ''
        : `/${currentScript?.filename.slice(0, -3)}`
    }`,
  );

  const copyLink = async () => {
    onCopy();
    toast({
      title: 'App link copied',
      status: 'info',
      duration: 1500,
      isClosable: true,
    });
  };

  const errorTooltip = editorHasErrors() && (
    <>
      Fix errors in the following files before running:
      <UnorderedList>
        {getErrorFiles().map((f) => (
          <ListItem>{f}</ListItem>
        ))}
      </UnorderedList>
    </>
  );

  const publish = async () => {
    try {
      await save();
      await publishApp.mutateAsync({
        id: app.id,
      });
      boot('prod');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <HStack
        color="purple.700"
        px={4}
        py={2}
        rounded="lg"
        justifyContent="space-between"
        border="1px"
        borderColor="gray.200"
        w="full"
      >
        <Text fontWeight="semibold" fontSize="xs" whiteSpace="nowrap" flex={1}>
          <Link
            href={`${
              process.env.NODE_ENV === 'development' ? 'http' : 'https'
            }://${appLink}${
              currentScript?.filename === 'main.ts'
                ? ''
                : `/${currentScript?.filename.slice(0, -3)}`
            }`}
            target="_blank"
          >
            {currentScript?.filename === 'main.ts' ? (
              <>{appLink}</>
            ) : (
              <>{`${appLink}/${currentScript?.filename.slice(0, -3)}`}</>
            )}
          </Link>
        </Text>
        <Tooltip label="Copy" bgColor="purple.500" textColor="gray.100">
          <IconButton
            aria-label="copy"
            colorScheme="purple"
            variant="ghost"
            size="xs"
            onClick={copyLink}
          >
            <HiOutlineClipboard />
          </IconButton>
        </Tooltip>
      </HStack>
      <Tooltip label={errorTooltip}>
        <span>
          <Button
            colorScheme="purple"
            variant={currentScript?.filename === 'main.ts' ? 'solid' : 'ghost'}
            display="flex"
            gap={2}
            fontWeight="medium"
            isDisabled={editorHasErrors()}
            onClick={publish}
          >
            <HiOutlineUpload />
            <Text>Publish</Text>
          </Button>
        </span>
      </Tooltip>
    </>
  );
};
