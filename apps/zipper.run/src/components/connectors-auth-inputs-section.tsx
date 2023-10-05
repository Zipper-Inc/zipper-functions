import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  AccordionProps,
  Box,
  VStack,
} from '@chakra-ui/react';
import { getInputSummary } from './input-summary';
import AuthUserConnectors, { AuthUserConnectorsProps } from './user-connectors';
import UserInputs, { UserInputsProps } from './user-inputs';

export type ConnectorsAuthInputsSectionProps = {
  isCollapsible?: boolean;
  expandByDefault?: boolean;
  userAuthProps: AuthUserConnectorsProps;
  userInputsProps: UserInputsProps;
  toggleIsExpanded?: (isExpanded: boolean) => void;
};

const ConnectorsAuthInputsSection: React.FC<
  ConnectorsAuthInputsSectionProps
> = ({
  isCollapsible,
  userAuthProps,
  userInputsProps,
  expandByDefault,
  toggleIsExpanded,
}) => {
  const inputsSection = (
    <VStack align="center" w="full">
      {userAuthProps.userAuthConnectors.length > 0 && (
        <AuthUserConnectors {...userAuthProps} />
      )}
      <UserInputs {...userInputsProps} />
    </VStack>
  );
  const onChange: AccordionProps['onChange'] =
    typeof toggleIsExpanded === 'function'
      ? (arg) => toggleIsExpanded(!arg)
      : undefined;

  const inputSummary = getInputSummary(
    userInputsProps.inputs,
    userInputsProps.formContext,
  );

  return (
    <VStack minW={{ base: '100%', md: 'container.sm' }} align="stretch">
      {isCollapsible ? (
        <Accordion
          allowToggle
          defaultIndex={expandByDefault ? 0 : undefined}
          onChange={onChange}
        >
          <AccordionItem border="none">
            <AccordionButton _hover={{ bgColor: 'fg.50' }} color="fg.700">
              {inputSummary.trim() && (
                <Box as="span" flex="1" textAlign="left">
                  {inputSummary}
                </Box>
              )}
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel pb={4}>{inputsSection}</AccordionPanel>
          </AccordionItem>
        </Accordion>
      ) : (
        inputsSection
      )}
    </VStack>
  );
};

export default ConnectorsAuthInputsSection;
