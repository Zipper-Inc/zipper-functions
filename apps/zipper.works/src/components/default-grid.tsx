import { Grid, GridProps } from '@chakra-ui/react';

export default function DefaultGrid({ children, ...props }: GridProps) {
  return (
    <Grid
      templateColumns="repeat(12, 1fr)"
      gap={4}
      margin="auto"
      maxW="container.xl"
      paddingX={10}
      {...props}
    >
      {children}
    </Grid>
  );
}
