import {
  HStack,
  Text,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  Input,
  Link,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { VscCode, VscKebabVertical } from 'react-icons/vsc';
import React, { Fragment, useContext, useEffect, useRef } from 'react';
import AddScriptForm from '~/components/app/add-script-form';

import { Script } from '@prisma/client';
import { trpc } from '~/utils/trpc';
import { useForm } from 'react-hook-form';
import { EditorContext } from '../context/editorContext';

export function PlaygroundSidebar({
  app,
  mainScript,
}: {
  app: any;
  mainScript: Script;
}) {
  const { currentScript, setCurrentScript, isUserAnAppEditor } =
    useContext(EditorContext);
  const sortScripts = (a: any, b: any) => {
    let orderA;
    let orderB;

    // always make sure `main` is on top, respect order after
    if (a.id === mainScript?.id) orderA = -Infinity;
    else orderA = a.createdAt === null ? Infinity : a.createdAt;
    if (b.id === mainScript?.id) orderB = -Infinity;
    else orderB = b.createdAt === null ? Infinity : b.createdAt;
    return orderA > orderB ? 1 : -1;
  };

  const { register, handleSubmit, reset } = useForm();

  const [currentHoverId, setCurrentHoverId] = React.useState<string | null>(
    null,
  );

  const [lastHoverId, setLastHoverId] = React.useState<string | null>(null);

  const [isRenamingId, setIsRenamingId] = React.useState<string | null>(null);

  useEffect(() => {
    if (currentHoverId) {
      setLastHoverId(currentHoverId);
    }
  }, [currentHoverId]);

  useEffect(() => {
    setIsRenamingId(null);
  }, [currentScript]);

  const utils = trpc.useContext();
  const deleteScript = trpc.useMutation('script.delete', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id: app.id }]);
    },
  });

  const editScript = trpc.useMutation('script.edit', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id: app.id }]);
    },
  });

  const addScript = trpc.useMutation('script.add', {
    async onSuccess() {
      await utils.invalidateQueries(['app.byId', { id: app.id }]);
    },
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  return (
    <>
      <VStack alignItems="start" gap={1}>
        <HStack w="full">
          <VscCode />
          <Text size="sm" color="gray.600" flexGrow={1}>
            Functions
          </Text>
          {isUserAnAppEditor && (
            <Popover>
              <PopoverTrigger>
                <Flex pr={2}>
                  <AddIcon color="gray.500" height={3} />
                </Flex>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverBody>
                  <AddScriptForm
                    connectors={app.connectors}
                    scripts={app.scripts}
                    appId={app.id}
                  />
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
        </HStack>
        <VStack spacing={0} w="full">
          {app.scripts.sort(sortScripts).map((script: any, i: number) => (
            <Fragment key={script.id}>
              <HStack
                w="100%"
                px={2}
                py={isRenamingId && isRenamingId === script.id ? 0 : 1}
                background={
                  currentScript?.id === script.id ? 'purple.100' : 'transparent'
                }
                _hover={{
                  background:
                    currentScript?.id === script.id ? 'purple.100' : 'gray.100',
                }}
                onMouseEnter={() => setCurrentHoverId(script.id)}
                onMouseLeave={() => setCurrentHoverId(null)}
              >
                {isRenamingId && isRenamingId === script.id ? (
                  <Flex grow={1}>
                    <form
                      onSubmit={handleSubmit(({ name }) => {
                        if (name.length === 0) {
                          return;
                        }
                        editScript.mutateAsync({
                          id: isRenamingId,
                          data: {
                            name,
                          },
                        });
                        setIsRenamingId(null);
                      })}
                    >
                      <Input
                        fontSize="xs"
                        fontFamily="mono"
                        size="xs"
                        outline="none"
                        variant="flushed"
                        w="full"
                        backgroundColor="white"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') setIsRenamingId(null);
                        }}
                        {...register('name', { value: script.name })}
                      />
                    </form>
                  </Flex>
                ) : (
                  <Link
                    style={{ width: '100%' }}
                    onClick={() => {
                      setCurrentScript(script);
                    }}
                  >
                    <Flex grow={1} cursor="pointer">
                      <Text fontWeight="medium" fontSize="xs" fontFamily="mono">
                        {script.filename}
                      </Text>
                    </Flex>
                  </Link>
                )}
                <Menu>
                  <MenuButton as={Text}>
                    <VscKebabVertical
                      fill="black"
                      stroke="0"
                      visibility={
                        currentHoverId === script.id ||
                        currentScript?.id === script.id
                          ? 'visible'
                          : 'hidden'
                      }
                    />
                  </MenuButton>
                  <MenuList>
                    <MenuItem
                      onClick={() => {
                        const toDupe = app.scripts.find(
                          (script: Script) => script.id === lastHoverId,
                        );

                        addScript.mutateAsync({
                          name: `${toDupe.name} (copy)`,
                          appId: app.id,
                          code: toDupe.code,
                          order: app.scripts.length + 1,
                        });
                      }}
                    >
                      Duplicate
                    </MenuItem>
                    {i > 0 && (
                      <>
                        <MenuItem
                          onClick={() => {
                            setIsRenamingId(lastHoverId);
                            reset({
                              name: app.scripts.find(
                                (script: Script) => script.id === lastHoverId,
                              ).name,
                            });
                          }}
                        >
                          Rename
                        </MenuItem>
                        <MenuItem onClick={onOpen}>Delete</MenuItem>
                      </>
                    )}
                  </MenuList>
                </Menu>
              </HStack>
            </Fragment>
          ))}
        </VStack>
      </VStack>
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Customer
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
                onClick={async () => {
                  if (!lastHoverId) {
                    onClose();
                    return;
                  }
                  await deleteScript.mutateAsync({
                    id: lastHoverId,
                    appId: app.id,
                  });
                  onClose();
                }}
                ml={3}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
