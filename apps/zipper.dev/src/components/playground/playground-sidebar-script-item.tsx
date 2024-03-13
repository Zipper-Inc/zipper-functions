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
  Box,
  IconButton,
} from '@chakra-ui/react';
import NextLink from 'next/link';
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
import { brandColors, theme } from '@zipper/ui';

export type ScriptItemProps = {
  script: Script;
  isEditable: boolean;
  isRenaming: boolean;
  renameForm: UseFormReturn<{ fileName: string }>;
  renameScript: (id: string, name: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onStartRenaming: (id: string) => void;
  onEndRenaming: VoidFunction;
  canUserEdit: boolean;
};

const ScriptIcon = ({ script, ...propsPassedIn }: { script: Script } & any) => {
  const props = {
    ...propsPassedIn,
    size: '14px',
  };
  if (isReadme(script)) return <PiNote {...props} />;
  else if (isMain(script)) return <PiCode {...props} size="16px" />;
  else if (isHandler(script)) return <PiCodeSimpleDuotone {...props} />;
  else if (isConnector(script)) return <PiPlugsDuotone {...props} />;
  else if (isLib(script)) return <PiCodeSimple {...props} />;
  else return <PiQuestion {...props} />;
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
  const {
    resourceOwnerSlug,
    appSlug,
    currentScript,
    setCurrentScript,
    isModelDirty,
    modelHasErrors,
  } = useEditorContext();

  const isDirty = isModelDirty(script.filename);
  const hasErrors = modelHasErrors(script.filename);

  const highlightColor = useColorModeValue('primary.50', 'purple.900');
  const errorColor = useColorModeValue('red.400', 'red.600');

  const isSelected = currentScript?.id === script.id;

  return (
    <HStack
      px={3}
      py={isRenaming ? 0 : 1}
      rounded="2px"
      background={isSelected ? highlightColor : 'transparent'}
      _hover={{
        background: isSelected ? highlightColor : 'fg.50',
      }}
      role="group"
    >
      {isRenaming ? (
        <Flex grow={1}>
          <form
            onSubmit={renameForm.handleSubmit(({ fileName }) => {
              if (fileName.length === 0) {
                return;
              }
              renameScript(script.id, fileName);
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
              {...renameForm.register('fileName', { value: script.filename })}
            />
          </form>
        </Flex>
      ) : (
        <Link
          as={NextLink}
          style={{ width: '100%' }}
          _hover={{ textDecoration: 'none' }}
          href={`/${resourceOwnerSlug}/${appSlug}/src/${script.filename}`}
          onClick={(e) => {
            e.preventDefault();
            setCurrentScript(script);
          }}
        >
          <Flex cursor="pointer" gap={2} alignItems="center">
            <Box as="figure" color={isSelected ? 'primary.600' : undefined}>
              <ScriptIcon isSelected={isSelected} script={script} />
            </Box>
            <Text
              fontWeight={isDirty || hasErrors ? 900 : 'normal'}
              fontSize="sm"
              // fontFamily="mono"
              color={
                hasErrors ? errorColor : isSelected ? 'primary.600' : 'inherit'
              }
            >
              {script.filename === 'readme.md' ? 'README.md' : script.filename}
            </Text>
          </Flex>
        </Link>
      )}
      {canUserEdit && (
        <Menu>
          <MenuButton
            as={IconButton}
            size="xs"
            colorScheme={isSelected ? 'purple' : 'fg'}
            variant="link"
          >
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
          <MenuList color="chakra-body-text" fontSize="14px" rounded="2px">
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
