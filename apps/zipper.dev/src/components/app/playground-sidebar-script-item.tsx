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
  Icon,
} from '@chakra-ui/react';
import { Script } from '@prisma/client';
import { UseFormReturn } from 'react-hook-form';
import { HiDotsVertical } from 'react-icons/hi';
import { useEditorContext } from '../context/editor-context';

export type ScriptItemProps = {
  script: Script;
  isEditable: boolean;
  isRenaming: boolean;
  renameForm: UseFormReturn<{ name: string }>;
  renameScript: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStartRenaming: (id: string) => void;
  onEndRenaming: VoidFunction;
  canUserEdit: boolean;
};

export const ScriptItem: React.FC<ScriptItemProps> = ({
  script,
  isEditable,
  isRenaming,
  renameForm,
  renameScript,
  onDelete,
  onDuplicate,
  onStartRenaming,
  onEndRenaming,
  canUserEdit,
}) => {
  const { currentScript, setCurrentScript, isModelDirty, modelHasErrors } =
    useEditorContext();

  const isDirty = isModelDirty(`/${script.filename}`);
  const hasErrors = modelHasErrors(script.filename);

  return (
    <HStack
      rounded="md"
      px={3}
      py={isRenaming ? 0 : 1}
      background={
        currentScript?.id === script.id ? 'blackAlpha.400' : 'transparent'
      }
      _hover={{
        background: 'blackAlpha.400',
      }}
      role="group"
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
              backgroundColor="bgColor"
              color="purple.900"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') onEndRenaming();
              }}
              {...renameForm.register('name', { value: script.name })}
            />
          </form>
        </Flex>
      ) : (
        <Link
          style={{ width: '100%' }}
          _hover={{ textDecoration: 'none' }}
          onClick={() => {
            setCurrentScript(script);
          }}
        >
          <Flex grow={1} cursor="pointer">
            <Text
              fontWeight={isDirty || hasErrors ? 'bold' : 'medium'}
              fontSize="xs"
              fontFamily="mono"
              color={hasErrors ? 'red.400' : 'inherit'}
            >
              {script.filename}
            </Text>
          </Flex>
        </Link>
      )}
      {canUserEdit && (
        <Menu>
          <MenuButton as={Text}>
            <Icon
              as={HiDotsVertical}
              fontSize="xs"
              stroke="0"
              visibility={
                currentScript?.id === script.id ? 'visible' : 'hidden'
              }
              _groupHover={{
                visibility: 'visible',
              }}
            />
          </MenuButton>
          <MenuList color="chakra-body-text">
            <MenuItem onClick={() => onDuplicate(script.id)}>
              Duplicate
            </MenuItem>
            {isEditable && (
              <>
                <MenuItem onClick={() => onStartRenaming(script.id)}>
                  Rename
                </MenuItem>
                <MenuItem onClick={() => onDelete(script.id)}>Delete</MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
      )}
    </HStack>
  );
};
