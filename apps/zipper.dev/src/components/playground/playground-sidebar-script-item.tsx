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
  useColorModeValue,
} from '@chakra-ui/react';
import { Script } from '@prisma/client';
import { UseFormReturn } from 'react-hook-form';
import {
  PiCode,
  PiCodeSimple,
  PiCodeSimpleDuotone,
  PiDotsThreeVerticalBold,
  PiNote,
  PiPlugsDuotone,
  PiQuestion,
} from 'react-icons/pi';
import {
  isConnector,
  isHandler,
  isLib,
  isMain,
  isReadme,
} from '~/utils/playground.utils';
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

const ScriptIcon = ({ script }: { script: Script }) => {
  if (isReadme(script)) return <PiNote />;
  else if (isMain(script)) return <PiCode />;
  else if (isHandler(script)) return <PiCodeSimpleDuotone />;
  else if (isLib(script)) return <PiCodeSimple />;
  else if (isConnector(script)) return <PiPlugsDuotone />;
  else return <PiQuestion />;
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

  const highlightColor = useColorModeValue('blackAlpha.400', 'whiteAlpha.400');
  const errorColor = useColorModeValue('red.400', 'red.600');

  return (
    <HStack
      px={3}
      py={isRenaming ? 0 : 1}
      background={
        currentScript?.id === script.id ? highlightColor : 'transparent'
      }
      _hover={{
        background: highlightColor,
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
          <Flex grow={1} cursor="pointer" gap={2} alignItems="center">
            <ScriptIcon script={script} />
            <Text
              fontWeight={isDirty || hasErrors ? 'bold' : 'medium'}
              fontSize="xs"
              fontFamily="mono"
              color={hasErrors ? errorColor : 'inherit'}
            >
              {script.filename === 'readme.md' ? 'README.md' : script.filename}
            </Text>
          </Flex>
        </Link>
      )}
      {canUserEdit && (
        <Menu>
          <MenuButton as={Text}>
            <Icon
              as={PiDotsThreeVerticalBold}
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
