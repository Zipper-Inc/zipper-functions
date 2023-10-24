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
  Box,
} from '@chakra-ui/react';
import { HiCheck } from 'react-icons/hi';
import { getAppLink } from '@zipper/utils';
import { useEditorContext } from '../context/editor-context';
import { AppQueryOutput } from '~/types/trpc';
import { trpc } from '~/utils/trpc';
import { useRunAppContext } from '../context/run-app-context';
import SignedIn from '../auth/signed-in';
import { useState } from 'react';
import TimeAgo from 'timeago-react';

import {
  PiAppWindowDuotone,
  PiRocketLaunchDuotone,
  PiFloppyDiskBold,
} from 'react-icons/pi';
import { useAnalytics } from '~/hooks/use-analytics';
import { useUser } from '~/hooks/use-user';

export const PlaygroundPublishInfo = ({ app }: { app: AppQueryOutput }) => {
  const appLink = getAppLink(app.slug);
  const publishApp = trpc.app.publish.useMutation();
  const [isPublishing, setIsPublishing] = useState(false);
  const [buttonText, setButtonText] = useState(<Text>Update</Text>);

  const { save, editorHasErrors, getErrorFiles, isEditorDirty } =
    useEditorContext();
  const toast = useToast();

  const { boot } = useRunAppContext();

  const errorTooltip = editorHasErrors() && (
    <>
      Fix errors in the following files before running:
      <UnorderedList>
        {getErrorFiles().map((f) => (
          <ListItem key={f}>{f}</ListItem>
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
      boot({ shouldSave: false });
    } catch (e) {
      console.error(e);
    }
  };

  const isDirty = isEditorDirty();

  return (
    <>
      <SignedIn>
        {isDirty ? (
          <Button
            fontSize="sm"
            size="sm"
            colorScheme="purple"
            variant="outline"
            display="flex"
            gap={2}
            fontWeight="semibold"
            borderWidth={1.5}
            isDisabled={editorHasErrors()}
            opacity={
              app.publishedVersionHash !== app.playgroundVersionHash ? 1 : 0.6
            }
            onClick={async () => {
              try {
                await save();
              } catch (e) {
                console.error(e);
              }
            }}
          >
            <PiFloppyDiskBold />
            <Text>Save</Text>
          </Button>
        ) : (
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
                    fontWeight="semibold"
                    borderWidth={1.5}
                    isDisabled={editorHasErrors()}
                    opacity={
                      app.publishedVersionHash !== app.playgroundVersionHash
                        ? 1
                        : 0.6
                    }
                  >
                    <PiRocketLaunchDuotone />
                    <Text display={{ base: 'none', sm: 'block' }}>Publish</Text>
                  </Button>
                </span>
              </PopoverTrigger>
            </Tooltip>
            <PopoverContent p={4} mr={8}>
              <VStack alignItems="start">
                <HStack alignItems="start" mb="2">
                  <Box mt={0.5}>
                    <PiAppWindowDuotone />
                  </Box>
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
                        {appLink}
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

                {app.publishedVersionHash === app.playgroundVersionHash ? (
                  <HStack
                    w="full"
                    justifyContent="center"
                    borderTop="1px solid"
                    borderColor="gray.200"
                    pt="4"
                  >
                    <Icon as={HiCheck} color="green.500" />
                    <Text fontSize="sm">You're up to date</Text>
                  </HStack>
                ) : (
                  <Button
                    w="full"
                    colorScheme="purple"
                    onClick={publish}
                    isDisabled={isPublishing}
                  >
                    {buttonText}
                  </Button>
                )}
              </VStack>
            </PopoverContent>
          </Popover>
        )}
      </SignedIn>
    </>
  );
};
