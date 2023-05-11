import { Button, Container, HStack } from '@chakra-ui/react';
import { InputParams, InputType } from '@zipper/types';
import { HiOutlinePlay } from 'react-icons/hi2';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { formatShortDate, getFieldName } from '@zipper/utils';

type InputSummaryProps = {
  inputs: InputParams;
  formContext: UseFormReturn<FieldValues, any>;
  onEditAndRerun: VoidFunction;
};

const complexTypes = [InputType.any, InputType.array, InputType.object];

/**
 * `getInputSummary` gets runtime input values from form context and returns the
 * input summary with objects and arrays pushed at the end
 * @param inputs the inputs
 * @param formContext the formContext holding input values
 * @returns a string representing the summary of the inputs
 */
export const getInputSummary = (
  inputs: InputSummaryProps['inputs'],
  formContext: InputSummaryProps['formContext'],
) => {
  const inputValues = formContext.getValues();

  return (
    inputs
      .map((i) => ({
        ...i,
        fieldName: getFieldName(i.key, i.type),
      }))
      // push objects and arrays at the end
      .sort((a, b) => {
        const aComplex = complexTypes.includes(a.type);
        const bComplex = complexTypes.includes(b.type);
        if (aComplex && bComplex) {
          return 0;
        }
        if (aComplex) {
          return 1;
        }
        if (bComplex) {
          return -1;
        }
        return 0;
      })
      .map(({ key, fieldName, type, optional }) => {
        let value = inputValues[fieldName];
        // make filtering optional null and undefined values possible
        if ((value === undefined || value === null) && optional) {
          return undefined;
        }
        if (
          type === InputType.date &&
          Boolean(value) &&
          value.toString() !== 'Invalid Date'
        ) {
          value = formatShortDate(value);
        } else if (type === InputType.boolean) {
          value = Boolean(value);
        } else if (
          value === null ||
          value === undefined ||
          (type === InputType.string && !value) ||
          (complexTypes.includes(type) && !value.trim())
        ) {
          value = "'blank'";
        }
        // return `${key}: ${value}`;
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }

        return `${key}: ${value}`;
      })
      // filter undefined values
      .filter((s) => s !== undefined)
      .join(' / ')
  );
};

const InputSummary: React.FC<InputSummaryProps> = ({
  inputs,
  formContext,
  onEditAndRerun,
}) => {
  const inputSummary = getInputSummary(inputs, formContext);

  return (
    <HStack spacing={4} color="gray.600" fontSize="sm">
      <Container
        m={0}
        overflow="hidden"
        whiteSpace="nowrap"
        textOverflow="ellipsis"
        px={0}
        w="fit-content"
        fontWeight="normal"
      >
        {inputSummary}
      </Container>
      <Button
        variant="ghost"
        colorScheme="purple"
        gap={1}
        size="sm"
        fontWeight="normal"
        onClick={onEditAndRerun}
      >
        <HiOutlinePlay />
        Edit & Rerun
      </Button>
    </HStack>
  );
};

export default InputSummary;
