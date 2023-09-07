import { Input, Button, Flex, useToast, FormControl } from '@chakra-ui/react';
import React from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type WebSiteSubscriptionProps = Partial<
  Pick<
    React.CSSProperties,
    'flexDirection' | 'alignItems' | 'justifyContent' | 'gap'
  >
>;

export const WebSiteSubscriptionForm = ({
  flexDirection = 'column',
  ...props
}: WebSiteSubscriptionProps) => {
  const toast = useToast();

  const schema = z.object({
    email: z.string().email(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  type FormValues = z.infer<typeof schema>;

  const joinWaitlistApplet = async (data: FormValues) => {
    const res = await fetch('https://waitlist-manager.zipper.run/api/json', {
      method: 'POST',
      body: JSON.stringify({
        email: data.email,
      }),
    });

    return res.json();
  };

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    const response = await joinWaitlistApplet(data);

    if (response.data.error === 'User already registered in this waitlist') {
      toast({
        description: 'You are already on the waitlist!',
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
    } else {
      toast({
        description: response.data,
        status: 'success',
        duration: 9000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex
      direction={flexDirection}
      gap={1}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      w="full"
      aria-label="Subscription form"
      h="full"
      justify="center"
      align="center"
      {...props}
    >
      <FormControl isInvalid={!!errors.email} width="full">
        <Input
          height="2.75rem"
          width="full"
          bg="white"
          variant="outline"
          placeholder="Email address"
          borderColor="gray.300"
          fontSize="md"
          color="gray.500"
          {...register('email')}
        />
      </FormControl>

      <Button
        height="2.75rem"
        w="full"
        fontSize="md"
        bg="brandOrange.500"
        padding="10px 18px"
        color="white"
        fontWeight={500}
        isLoading={isSubmitting}
        _hover={{ background: 'brandOrange.700' }}
      >
        Join the beta
      </Button>
    </Flex>
  );
};
