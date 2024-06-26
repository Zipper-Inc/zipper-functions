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
  Box,
  Accordion,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AccordionButton,
  useColorMode,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
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
import { Markdown, Show } from '@zipper/ui';
import { getFileExtension } from '@zipper/utils';

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
  const {
    currentScript,
    setCurrentScript,
    refetchApp,
    tutorials,
    onChangeSelectedDoc,
    selectedTutorial,
  } = useEditorContext();

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
      await refetchApp();
    },
  });

  const renameScript = (id: string, fileName: string) => {
    editScriptQuery.mutateAsync({
      id: id,
      data: {
        filename: fileName,
      },
    });
    endRenaming();
  };

  const addScript = trpc.script.add.useMutation({
    async onSuccess() {
      await refetchApp();
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

    const extension = getFileExtension(toDupe.filename);

    addScript.mutateAsync({
      filename: `${toDupe.name}-copy.${extension}`,
      appId: app.id,
      code: toDupe.code,
      order: app.scripts.length + 1,
    });
  };

  const startRenaming: ScriptItemProps['onStartRenaming'] = (scriptId) => {
    setIsRenamingId(scriptId);
    renameForm.reset({
      fileName: app.scripts.find((script: Script) => script.id === scriptId)
        ?.filename,
    });
  };

  const requestDelete: ScriptItemProps['onDelete'] = (scriptId) => {
    setDeletingId(scriptId);
    onOpen();
  };

  const { style, onMouseEnter, onMouseLeave } = useHelpBorder();
  const { colorMode } = useColorMode();

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
        mr={{ base: '0', xl: 2 }}
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
      <VStack mr={{ base: '0', xl: 2 }} overflowY="auto" h="full" paddingY={4}>
        <Show when={!!tutorials[0]?.startLine}>
          <Accordion defaultIndex={[0]} allowMultiple width="100%">
            <AccordionItem>
              <h2>
                <AccordionButton bg="fg.100" _hover={{ bg: 'fg.200' }} h={6}>
                  <Box
                    as="span"
                    flex="1"
                    textAlign="left"
                    fontSize="sm"
                    color="fg.600"
                    fontWeight="bold"
                    textTransform="uppercase"
                  >
                    Guide
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
              </h2>
              <AccordionPanel px={0} py={0}>
                {tutorials.map((doc) => (
                  <HStack
                    align="start"
                    p={3}
                    gap={3}
                    color="fg.400"
                    bg={
                      doc.index === selectedTutorial.index
                        ? colorMode === 'dark'
                          ? '#413C26'
                          : 'yellow.100'
                        : 'bg.50'
                    }
                    _hover={{
                      bg:
                        doc.index === selectedTutorial.index
                          ? colorMode === 'dark'
                            ? '#413C26'
                            : 'yellow.100'
                          : colorMode === 'dark'
                          ? '#413C26'
                          : 'yellow.100',
                    }}
                    position="relative"
                    onClick={() => onChangeSelectedDoc(doc.index)}
                    cursor="pointer"
                  >
                    <Box fontSize="sm" flex={1}>
                      <Markdown>{doc.content.replace('@guide', '')}</Markdown>
                    </Box>
                    <Box
                      as="span"
                      maxW={12}
                      minW={5}
                      h={5}
                      fontSize="sm"
                      fontWeight="medium"
                      fontFamily="mono"
                      color="yellow.600"
                    >
                      {doc.startLine}
                    </Box>
                  </HStack>
                ))}
              </AccordionPanel>
            </AccordionItem>
          </Accordion>
        </Show>
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
