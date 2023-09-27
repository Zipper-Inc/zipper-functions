import { Heading, Text, VStack } from '@chakra-ui/react';

export function HandlerDescription({
  config,
}: {
  config?: Zipper.HandlerConfig;
}) {
  if (!config || !config.description) {
    return <></>;
  }

  const { title, subtitle, body } = config.description;
  if (!title && !subtitle && !body) {
    return <></>;
  }

  return (
    <VStack mb="10">
      {title && <Heading as="h1">{title}</Heading>}
      {subtitle && (
        <Heading as="h2" fontSize="lg" fontWeight="semibold" color="fg.600">
          {subtitle}
        </Heading>
      )}
      {body && <Text>{body}</Text>}
    </VStack>
  );
}
