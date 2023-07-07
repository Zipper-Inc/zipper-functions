import {
  HStack,
  Tooltip,
  Text,
  Link,
  useToast,
  UnorderedList,
  ListItem,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  VStack,
  Icon,
  Spinner,
} from '@chakra-ui/react';
import { HiCheck, HiGlobe, HiOutlineUpload } from 'react-icons/hi';
import { getAppLink } from '@zipper/utils';
import { useEditorContext } from '../context/editor-context';
import { AppQueryOutput } from '~/types/trpc';
import { trpc } from '~/utils/trpc';
import { useRunAppContext } from '../context/run-app-context';
import SignedIn from '../auth/signed-in';
import { useState } from 'react';
import TimeAgo from 'timeago-react';
import { HiGlobeAlt } from 'react-icons/hi2';

export const PlaygroundPublishInfo = ({ app }: { app: AppQueryOutput }) => {
  const appLink = getAppLink(app.slug);
  const publishApp = trpc.useMutation('app.publish');
  const [isPublishing, setIsPublishing] = useState(false);
  const [buttonText, setButtonText] = useState(<Text>Update</Text>);

  const { save, currentScript, editorHasErrors, getErrorFiles } =
    useEditorContext();
  const toast = useToast();

  const { boot } = useRunAppContext();

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
      setIsPublishing(true);
      setButtonText(<Spinner />);
      await save();
      await publishApp.mutateAsync(
        {
          id: app.id,
        },
        {
          onSuccess: () => {
            setIsPublishing(false);
            setButtonText(
              <HStack>
                <HiCheck />
                <Text>Update</Text>
              </HStack>,
            );
            setTimeout(() => {
              setButtonText(<Text>Update</Text>);
            }, 2000);
          },
          onError: (e) => {
            setIsPublishing(false);
            toast({
              title: 'Error publishing app',
              description: e.message,
              status: 'error',
            });
          },
        },
      );
      boot();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <>
      <SignedIn>
        <Popover isLazy>
          <Tooltip label={errorTooltip}>
            <PopoverTrigger>
              <span>
                <Button
                  fontSize="sm"
                  size="sm"
                  colorScheme="purple"
                  variant="outline"
                  display="flex"
                  gap={2}
                  fontWeight="medium"
                  isDisabled={editorHasErrors()}
                >
                  <HiOutlineUpload />
                  <Text>Publish</Text>
                </Button>
              </span>
            </PopoverTrigger>
          </Tooltip>
          <PopoverContent p={4} mr={8}>
            <VStack alignItems="start">
              <HStack alignItems="start" mb="2">
                <Icon as={HiGlobeAlt} mt={1} />
                <VStack alignItems="flex-start" spacing={1}>
                  <Text fontWeight="semibold" fontSize="xs">
                    <Link
                      href={`${
                        process.env.NODE_ENV === 'development'
                          ? 'http'
                          : 'https'
                      }://${appLink}`}
                      target="_blank"
                    >
                      {currentScript?.filename === 'main.ts' ? (
                        <>{appLink}</>
                      ) : (
                        <>{`${appLink}/${currentScript?.filename.slice(
                          0,
                          -3,
                        )}`}</>
                      )}
                    </Link>
                  </Text>
                  {app.publishedVersion && (
                    <Text fontSize="xs" color="fg.500">
                      <>
                        Last published{' '}
                        <TimeAgo datetime={app.publishedVersion?.createdAt} />
                      </>
                    </Text>
                  )}
                </VStack>
              </HStack>
              <Button
                w="full"
                colorScheme="purple"
                onClick={publish}
                isDisabled={isPublishing}
              >
                {buttonText}
              </Button>
            </VStack>
          </PopoverContent>
        </Popover>
      </SignedIn>
    </>
  );
};
