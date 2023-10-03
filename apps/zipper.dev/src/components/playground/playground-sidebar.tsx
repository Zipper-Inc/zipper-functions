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
import React, { useEffect, useMemo, useRef, useState } from 'react';
import AddScriptForm from '~/components/playground/add-script-form';
import { useHelpBorder } from '~/components/context/help-mode-context';

import { Script } from '@prisma/client';
import { trpc } from '~/utils/trpc';
import { useForm } from 'react-hook-form';
import { useEditorContext } from '../context/editor-context';
import { AppQueryOutput } from '~/types/trpc';
import { ScriptItem, ScriptItemProps } from './playground-sidebar-script-item';
import { PiPlusSquare } from 'react-icons/pi';
import {
  isReadme,
  isMain,
  isHandler,
  isLib,
  isConnector,
} from '~/utils/playground.utils';

// Order should always be:
// - README.md
// - main.ts
// - other-handlers.ts
// - whatever-connector.ts
// - other libs and stuff
const getSortingName = (script: Script) => {
  let prefix = '99';
  if (isReadme(script)) prefix = '00';
  else if (isMain(script)) prefix = '01';
  else if (isHandler(script)) prefix = '02';
  else if (isLib(script)) prefix = '03';
  else if (isConnector(script)) prefix = '04';
  else prefix = '04';
  return `${prefix}-${script.filename}`;
};

const sortScripts = (a: Script, b: Script) => {
  return getSortingName(a) > getSortingName(b) ? 1 : -1;
};

export function PlaygroundSidebar({
  app,
  mainScript,
}: {
  app: AppQueryOutput;
  mainScript: Script;
}) {
  const { currentScript, setCurrentScript } = useEditorContext();
  const { refetchApp } = useEditorContext();

  const renameForm: ScriptItemProps['renameForm'] = useForm();

  const [isRenamingId, setIsRenamingId] = React.useState<string | null>(null);
  const endRenaming = () => setIsRenamingId(null);

  useEffect(() => {
    endRenaming();
  }, [currentScript]);

  const deleteScript = trpc.script.delete.useMutation({
    async onSuccess() {
      setDeletingId(null);
      refetchApp();
    },
  });

  const editScriptQuery = trpc.script.edit.useMutation({
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

  const addScript = trpc.script.add.useMutation({
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

  const { style, onMouseEnter, onMouseLeave } = useHelpBorder();

  /**
   * **Virtual Storage.json file:**
   * Adding `storage.json` file for display current data keys and values
   * from Zipper.Storage (aka. app.datastore)
   */
  const storageScript = {
    id: String(crypto.randomUUID()),
    createdAt: '',
    updatedAt: '',
    name: 'Storage',
    filename: 'storage.json',
    code: JSON.stringify(app.datastore, null, '\t'),
    order: 0,
    appId: app.id,
    connectorId: null,
    hash: null,
    isRunnable: false,
  };

  const appScripts = useMemo(() => {
    if (app.canUserEdit) {
      const scripts = app.datastore
        ? ([...app.scripts, storageScript] as typeof app.scripts)
        : app.scripts;

      return scripts;
    }

    return app.scripts;
  }, [app]);

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
        onMouseEnter={onMouseEnter('PlaygroundSidebar')}
        onMouseLeave={onMouseLeave()}
        outline={style('PlaygroundSidebar').border}
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
          {appScripts.sort(sortScripts).map((script, i) => (
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
