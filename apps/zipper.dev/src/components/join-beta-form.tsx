import { useState } from 'react';
import { z } from 'zod';
import {
  Button,
  Box,
  Flex,
  Input,
  Text,
  FormControl,
  FormHelperText,
  FormErrorMessage,
  useToast,
} from '@chakra-ui/react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

export default function JoinBetaForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const toast = useToast();

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
    <Flex as="form" onSubmit={handleSubmit(onSubmit)} gap={2}>
      <FormControl isInvalid={!!errors.email} width="full">
        <Input
          height="2.75rem"
          width={{ base: 'full', md: '20rem' }}
          variant="outline"
          placeholder="Email address"
          borderColor="gray.300"
          fontSize="md"
          color="gray.500"
          {...register('email')}
        />
        {errors.email && (
          <FormErrorMessage color={'red.300'}>
            {errors.email?.message}
          </FormErrorMessage>
        )}
      </FormControl>

      <Button
        height="2.75rem"
        minWidth={{ base: '7rem', md: '138px' }}
        fontSize={{ base: 'sm', md: 'md' }}
        bg="brandOrange.500"
        padding={{ base: '5px 8px', md: '10px 18px' }}
        color="white"
        fontWeight={500}
        _hover={{ background: 'brandOrange.700' }}
        type="submit"
        isLoading={isSubmitting}
      >
        Join the beta
      </Button>
    </Flex>
  );
}
