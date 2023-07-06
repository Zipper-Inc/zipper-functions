import { CloseIcon } from '@chakra-ui/icons';
import { HStack, Input, IconButton, Box } from '@chakra-ui/react';

import { UseFormRegister } from 'react-hook-form';
import { FiTrash } from 'react-icons/fi';
import { HiOutlineLockClosed } from 'react-icons/hi';

export type SecretToDelete = {
  id: string;
  appId: string;
};

type EditSecretProps =
  | {
      existingSecret: undefined;
      register: UseFormRegister<any>;
      index: number;
      remove: (index?: number) => void;
    }
  | {
      existingSecret: {
        key: string;
        id: string;
        appId: string;
      };
      editable?: boolean;
      remove: (args: SecretToDelete) => void;
    };

export const EditSecret: React.FC<EditSecretProps> = (props) => {
  if (!props.existingSecret) {
    const { index, register, remove } = props;
    return (
      <HStack>
        <Box color="fg400">
          <HiOutlineLockClosed />
        </Box>
        <Input placeholder="Key" {...register(`secrets.${index}.key`, {})} />
        <Input
          placeholder="Value"
          {...register(`secrets.${index}.value`, {})}
        />

        <IconButton
          variant="ghost"
          colorScheme="red"
          aria-label="delete"
          onClick={() => {
            remove(index);
          }}
        >
          <CloseIcon boxSize={3} />
        </IconButton>
      </HStack>
    );
  }

  const { existingSecret, editable, remove } = props;

  return (
    <HStack>
      <Box color="fg400">
        <HiOutlineLockClosed />
      </Box>
      <Input placeholder="Key" disabled value={existingSecret.key} />
      <Input
        placeholder="Value"
        disabled
        type="password"
        value="we're not showing you this"
      />
      {editable && (
        <IconButton
          variant="ghost"
          colorScheme="red"
          aria-label="delete"
          onClick={() => {
            remove({ appId: existingSecret.appId, id: existingSecret.id });
          }}
        >
          <FiTrash />
        </IconButton>
      )}
    </HStack>
  );
};
