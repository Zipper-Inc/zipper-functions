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
import { VscKebabVertical } from 'react-icons/vsc';
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
              backgroundColor="white"
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
          <Icon
            as={VscKebabVertical}
            fill="black"
            stroke="0"
            visibility={currentScript?.id === script.id ? 'visible' : 'hidden'}
            _groupHover={{
              visibility: 'visible',
            }}
          />
        </MenuButton>
        <MenuList>
          <MenuItem onClick={() => onDuplicate(script.id)}>Duplicate</MenuItem>
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
    </HStack>
  );
};
