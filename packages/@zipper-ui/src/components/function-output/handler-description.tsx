import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Flex,
  Heading,
  useMediaQuery,
  VStack,
} from '@chakra-ui/react';
import { AppInfo } from '@zipper/types';
import { Markdown } from './markdown';

type HandlerDescription = {
  title?: string;
  subtitle?: string;
  body?: string;
};

type Props = {
  applet?: AppInfo;
  config?: Zipper.HandlerConfig;
  filename?: string;
  description?: HandlerDescription;
};

export const getDescription = ({ applet, config, filename }: Props) => {
  const hasConfigDescription = Object.values(config?.description || {}).find(
    (truthy) => !!truthy,
  );
  const { title, subtitle, body } = {
    title: applet?.name,
    subtitle: filename && filename !== 'main.ts' && filename.replace('.ts', ''),
    body:
      !hasConfigDescription && filename === 'main.ts' && applet?.description,
    ...config?.description,
  };

  if (title || subtitle || body)
    return { title, subtitle, body } as HandlerDescription;
};

export function HandlerDescription(props: Props) {
  const description = props.description || getDescription(props);
  if (!description) return null;

  const [isMobile] = useMediaQuery('(max-width: 600px)');

  const { title, subtitle, body } = description;

  const MobileView = () => (
    <Accordion allowToggle>
      <AccordionItem
        border="none"
        bg="white"
        position="relative"
        _active={{
          bg: 'bgColor',
        }}
        _hover={{
          bg: 'bgColor',
        }}
        px={0}
      >
        {({ isExpanded }) => (
          <>
            <h2>
              <AccordionButton
                px={0}
                borderColor="red"
                position="relative"
                border="none"
                // pb={isExpanded ? 8 : undefined}
                _active={{
                  bg: 'bgColor',
                }}
                _hover={{
                  bg: 'bgColor',
                }}
                bg="white"
              >
                <Box as="span" flex="1" textAlign="left">
                  {title && (
                    <Heading
                      as="h1"
                      fontSize={{ base: 'xl', md: '2xl' }}
                      fontWeight="semibold"
                    >
                      {title}
                    </Heading>
                  )}
                  {subtitle && (
                    <Heading
                      as="h2"
                      fontSize="md"
                      fontWeight="normal"
                      color="fg.600"
                    >
                      {isExpanded ? subtitle : subtitle.slice(0, 80) + '...'}
                    </Heading>
                  )}
                </Box>
                <AccordionIcon zIndex={10} />
                <Box
                  position="absolute"
                  bottom={0}
                  w="full"
                  bgGradient={
                    !isExpanded
                      ? 'linear(to-t, bgColor, transparent)'
                      : 'transparent'
                  }
                  height="50%"
                />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4} px={0}>
              {body && <Markdown>{body}</Markdown>}
            </AccordionPanel>
          </>
        )}
      </AccordionItem>
    </Accordion>
  );

  return (
    <>
      {isMobile ? (
        <MobileView />
      ) : (
        <VStack align="start" width="full">
          {subtitle && (
            <Heading as="h2" fontSize="xl" fontWeight="normal" color="fg.600">
              {subtitle}
            </Heading>
          )}
          {body && (
            <Flex
              direction="column"
              pt={title || subtitle ? 2 : undefined}
              align="stretch"
              width="100%"
              fontSize="sm"
            >
              <Markdown>{body}</Markdown>
            </Flex>
          )}
        </VStack>
      )}
    </>
  );
}
