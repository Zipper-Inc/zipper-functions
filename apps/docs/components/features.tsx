import { ComponentWithAs, Grid, IconProps } from '@chakra-ui/react';
import Feature from './feature';

export default function Features({
  features,
}: {
  features: {
    Icon?: ComponentWithAs<'svg', IconProps>;
    name: string;
    description: string;
  }[];
}) {
  return (
    <Grid templateColumns="repeat(3, 1fr)" gap={6} mt={6}>
      {features.map((feature, index) => (
        <Feature key={index} {...feature} />
      ))}
    </Grid>
  );
}
