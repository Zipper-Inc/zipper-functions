import { Card, CardBody, CardHeader, Heading, Text } from '@chakra-ui/react';

export default function Feature({
  name,
  description,
}: {
  name: string;
  description: string;
}) {
  return (
    <Card variant={'elevated'}>
      <CardHeader>
        <Heading size="md">{name}</Heading>
      </CardHeader>
      <CardBody>
        <Text>{description}</Text>
      </CardBody>
    </Card>
  );
}
