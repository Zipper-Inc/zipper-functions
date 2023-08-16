import {
  Card,
  CardBody,
  CardHeader,
  ComponentWithAs,
  Heading,
  IconProps,
  Text,
} from '@chakra-ui/react';

export default function Feature({
  Icon,
  name,
  description,
}: {
  Icon?: ComponentWithAs<'svg', IconProps>;
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
