import { CloseIcon } from '@chakra-ui/icons';
import { HStack, Input, IconButton, Box } from '@chakra-ui/react';
import { useState } from 'react';

import { UseFormRegister } from 'react-hook-form';
import { FiCheck, FiCopy } from 'react-icons/fi';
import { PiKey, PiKeyDuotone, PiTrashSimpleBold } from 'react-icons/pi';

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
  const [copied, setCopied] = useState(false);
  if (!props.existingSecret) {
    const { index, register, remove } = props;
    return (
      <HStack>
        <Box color="fg.400">
          <PiKey />
        </Box>
        <Input
          placeholder="Key"
          spellCheck="false"
          {...register(`secrets.${index}.key`, {})}
        />
        <Input
          placeholder="Value"
          autoComplete="off"
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
      <Box color="fg.400">
        <PiKeyDuotone />
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
          <PiTrashSimpleBold />
        </IconButton>
      )}

      {existingSecret.appId && (
        <IconButton
          variant="ghost"
          colorScheme="purple"
          aria-label="delete"
          icon={copied ? <FiCheck /> : <FiCopy />}
          onClick={() => {
            setCopied(true);

            navigator.clipboard.writeText(
              `Deno.env.get('${existingSecret.key}')`,
            );

            setTimeout(() => {
              setCopied(false);
            }, 1000);
          }}
        />
      )}
    </HStack>
  );
};
