import {
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionIcon,
  AccordionPanel,
  Box,
  AccordionProps,
} from '@chakra-ui/react';
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
    <VStack align="stretch" spacing={6}>
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

  return (
    <VStack maxW="container.sm" minW={500} align="stretch">
      {/* {screen === 'edit' ? ( */}
      {isCollapsible ? (
        <Accordion
          allowToggle
          rounded="2xl"
          defaultIndex={expandByDefault ? 0 : undefined}
          onChange={onChange}
        >
          <AccordionItem border="none">
            <AccordionButton
              _hover={{ bgColor: 'gray.50' }}
              color="gray.700"
              rounded="xl"
            >
              <Box as="span" flex="1" textAlign="left">
                Configuration
              </Box>
              <AccordionIcon />
            </AccordionButton>
            {/* <h2></h2> */}
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
