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
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { VscCode } from 'react-icons/vsc';
import React, { useEffect, useRef, useState } from 'react';
import AddScriptForm from '~/components/app/add-script-form';

import { Script } from '@prisma/client';
import { trpc } from '~/utils/trpc';
import { useForm } from 'react-hook-form';
import { useEditorContext } from '../context/editor-context';
import { AppQueryOutput } from '~/types/trpc';
import { ScriptItem, ScriptItemProps } from './playground-sidebar-script-item';

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
      <VStack alignItems="start" gap={1}>
        <HStack w="full">
          <VscCode />
          <Text size="sm" color="gray.600" flexGrow={1}>
            Functions
          </Text>
          {app.canUserEdit && (
            <Popover>
              {({ onClose }) => (
                <>
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
                        appId={app.id}
                        onCreate={onClose}
                      />
                    </PopoverBody>
                  </PopoverContent>
                </>
              )}
            </Popover>
          )}
        </HStack>
        <VStack spacing={0} w="full">
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
