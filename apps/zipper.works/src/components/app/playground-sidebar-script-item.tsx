import {
  HStack,
  Flex,
  Input,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Link,
} from '@chakra-ui/react';
import { Script } from '@prisma/client';
import { UseFormReturn } from 'react-hook-form';
import { VscKebabVertical } from 'react-icons/vsc';
import { AppQueryOutput } from '~/types/trpc';
import { useEditorContext } from '../context/editor-context';

export type ScriptItemProps = {
  app: AppQueryOutput;
  script: Script;
  isEditable: boolean;
  isRenaming: boolean;
  setIsRenamingId: React.Dispatch<React.SetStateAction<string | null>>;
  currentHoverId: string | null;
  setCurrentHoverId: React.Dispatch<React.SetStateAction<string | null>>;
  lastHoverId: string | null;
  setLastHoverId: React.Dispatch<React.SetStateAction<string | null>>;
  renameForm: UseFormReturn<{ name: string }>;
  renameScript: (id: string, name: string) => void;
  addScript: any;
  onDelete: VoidFunction;
  onDuplicate: (id: string) => void;
  startRenaming: (id: string) => void;
};

export const ScriptItem: React.FC<ScriptItemProps> = ({
  app,
  script,
  isEditable,
  isRenaming,
  setIsRenamingId,
  currentHoverId,
  setCurrentHoverId,
  renameForm,
  renameScript,
  lastHoverId,
  setLastHoverId,
  addScript,
  onDelete,
  onDuplicate,
  startRenaming,
}) => {
  const { currentScript, setCurrentScript, isModelDirty } = useEditorContext();

  return (
    <HStack
      w="100%"
      px={2}
      py={isRenaming ? 0 : 1}
      background={
        currentScript?.id === script.id ? 'purple.100' : 'transparent'
      }
      _hover={{
        background: currentScript?.id === script.id ? 'purple.100' : 'gray.100',
      }}
      onMouseEnter={() => setCurrentHoverId(script.id)}
      onMouseLeave={() => setCurrentHoverId(null)}
    >
      {isRenaming ? (
        <Flex grow={1}>
          <form
            onSubmit={renameForm.handleSubmit(({ name }) => {
              if (name.length === 0) {
                return;
              }
              renameScript(script.id, name);
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
              {...renameForm.register('name', { value: script.name })}
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
            <Text
              fontWeight={
                isModelDirty(`/${script.filename}`) ? 'bold' : 'medium'
              }
              fontSize="xs"
              fontFamily="mono"
            >
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
              currentHoverId === script.id || currentScript?.id === script.id
                ? 'visible'
                : 'hidden'
            }
          />
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => onDuplicate(script.id)}>Duplicate</MenuItem>
          {isEditable && (
            <>
              <MenuItem onClick={() => startRenaming(script.id)}>
                Rename
              </MenuItem>
              <MenuItem onClick={onDelete}>Delete</MenuItem>
            </>
          )}
        </MenuList>
      </Menu>
    </HStack>
  );
};
