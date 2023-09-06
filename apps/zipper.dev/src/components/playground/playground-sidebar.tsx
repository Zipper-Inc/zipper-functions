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
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import AddScriptForm from '~/components/playground/add-script-form';

import { Script } from '@prisma/client';
import { trpc } from '~/utils/trpc';
import { useForm } from 'react-hook-form';
import { useEditorContext } from '../context/editor-context';
import { AppQueryOutput } from '~/types/trpc';
import { ScriptItem, ScriptItemProps } from './playground-sidebar-script-item';
import { PiPlusSquare } from 'react-icons/pi';

export function PlaygroundSidebar({
  app,
  mainScript,
}: {
  app: AppQueryOutput;
  mainScript: Script;
}) {
  const { currentScript, setCurrentScript } = useEditorContext();
  const { refetchApp } = useEditorContext();
  const sortScripts = (a: Script, b: Script) => {
    let orderA;
    let orderB;

    // always make sure `main` is on top, respect order after
    if (a.id === mainScript?.id) orderA = -Infinity;
    else orderA = a.createdAt === null ? Infinity : a.createdAt;
    if (b.id === mainScript?.id) orderB = -Infinity;
    else orderB = b.createdAt === null ? Infinity : b.createdAt;

    // now let's make sure non-runnable files go below runnable scripts
    if (!a.isRunnable) orderA = new Date(a.createdAt.getTime() * 100);
    if (!b.isRunnable) orderB = new Date(b.createdAt.getTime() * 100);
    return orderA > orderB ? 1 : -1;
  };

  const renameForm: ScriptItemProps['renameForm'] = useForm();

  const [isRenamingId, setIsRenamingId] = React.useState<string | null>(null);
  const endRenaming = () => setIsRenamingId(null);

  useEffect(() => {
    endRenaming();
  }, [currentScript]);

  const deleteScript = trpc.useMutation('script.delete', {
    async onSuccess() {
      setDeletingId(null);
      refetchApp();
    },
  });

  const editScriptQuery = trpc.useMutation('script.edit', {
    async onSuccess() {
      refetchApp();
    },
  });

  const renameScript = (id: string, name: string) => {
    editScriptQuery.mutateAsync({
      id: id,
      data: {
        name,
      },
    });
    endRenaming();
  };

  const addScript = trpc.useMutation('script.add', {
    async onSuccess() {
      refetchApp();
    },
  });

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const cancelRef = useRef() as React.MutableRefObject<HTMLButtonElement>;

  const bgGradient = useColorModeValue(
    'linear-gradient(326.37deg, rgba(62, 28, 150, 0.5) 8.28%, rgba(62, 28, 150, 0) 100.06%), #89279B',
    'linear-gradient(326.37deg, rgba(86, 60, 150, 0.5) 8.28%, rgba(86, 60, 150, 0) 100.06%), #E5BEEB',
  );

  const onDuplicate: ScriptItemProps['onDuplicate'] = (scriptId) => {
    const toDupe = app.scripts.find((script: Script) => script.id === scriptId);

    if (!toDupe) return;

    addScript.mutateAsync({
      name: `${toDupe.name}-copy`,
      appId: app.id,
      code: toDupe.code,
      order: app.scripts.length + 1,
    });
  };

  const startRenaming: ScriptItemProps['onStartRenaming'] = (scriptId) => {
    setIsRenamingId(scriptId);
    renameForm.reset({
      name: app.scripts.find((script: Script) => script.id === scriptId)?.name,
    });
  };

  const requestDelete: ScriptItemProps['onDelete'] = (scriptId) => {
    setDeletingId(scriptId);
    onOpen();
  };

  return (
    <>
      <VStack
        alignItems="stretch"
        background={bgGradient}
        color="bgColor"
        flex={1}
        paddingX={2}
        paddingY={4}
        spacing={4}
        boxShadow="lg"
        mr={2}
      >
        <HStack px={3}>
          <Text size="sm" flexGrow={1} fontWeight="medium">
            Files
          </Text>
          {app.canUserEdit && (
            <Popover>
              {({ onClose }) => (
                <>
                  <PopoverTrigger>
                    <Flex
                      _hover={{ cursor: 'pointer', transform: 'scale(1.1)' }}
                    >
                      <PiPlusSquare />
                    </Flex>
                  </PopoverTrigger>
                  <PopoverContent>
                    <PopoverArrow />
                    <PopoverBody color="chakra-body-text" p="0">
                      <AddScriptForm
                        connectors={app.connectors}
                        appId={app.id}
                        onCreate={(script) => {
                          onClose();
                          setCurrentScript(script);
                        }}
                      />
                    </PopoverBody>
                  </PopoverContent>
                </>
              )}
            </Popover>
          )}
        </HStack>
        <VStack spacing="2px" alignItems="stretch">
          {app.scripts.sort(sortScripts).map((script, i) => (
            <ScriptItem
              key={script.id}
              script={script}
              isRenaming={Boolean(isRenamingId) && isRenamingId === script.id}
              onEndRenaming={endRenaming}
              isEditable={i > 0}
              renameScript={renameScript}
              renameForm={renameForm}
              onDelete={requestDelete}
              onDuplicate={onDuplicate}
              onStartRenaming={startRenaming}
              canUserEdit={app.canUserEdit}
            />
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
              Delete File
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
                  if (!deletingId) {
                    onClose();
                    return;
                  }
                  await deleteScript.mutateAsync(
                    {
                      id: deletingId,
                      appId: app.id,
                    },
                    {
                      onSuccess: () => {
                        if (deletingId === currentScript?.id) {
                          setCurrentScript(mainScript);
                        }
                      },
                    },
                  );
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
