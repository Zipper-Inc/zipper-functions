import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Textarea,
  ModalFooter,
  Spinner,
  Text,
  Box,
  Input,
  useToast,
} from '@chakra-ui/react';

import Link from 'next/link';
import { useRef, useState } from 'react';

import { PiPaperclipDuotone } from 'react-icons/pi';
import { useAnalytics } from '~/hooks/use-analytics';
import { useUser } from '~/hooks/use-user';
import { trpc } from '~/utils/trpc';

export function ContactModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState('');
  const { user } = useUser();
  const analytics = useAnalytics();
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const contactSupportMutation = trpc.useMutation('user.contactSupport');

  const [file, setFile] = useState<any>();

  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        setFile(reader.result);
      };
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSubmittingFeedback(false);
          onClose();
        }}
        size="xl"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Contact support</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>
                What is the issue? Share anything you think it's valuable and
                we'll help you in the best way possible!
              </FormLabel>
              <Textarea onChange={(e) => setFeedback(e.target.value)} />
            </FormControl>
            <FormControl mt={2}>
              <Button
                bg="transparent"
                _hover={{ bgColor: 'transparent', textDecoration: 'underline' }}
                display="flex"
                alignItems={'center'}
                alignContent={'center'}
                justifyContent={'center'}
                p={0}
                gap={2}
                onClick={handleButtonClick}
                mt={2}
              >
                <PiPaperclipDuotone />
                <Text color="fg.600">Add an images, files or videos</Text>
                {fileInputRef.current && fileInputRef.current.files?.length ? (
                  <Text fontSize="sm" color="gray.500">
                    {fileInputRef.current?.files?.[0]?.name || 'No file chosen'}
                  </Text>
                ) : (
                  ''
                )}
                <Input
                  type="file"
                  style={{ display: 'none' }}
                  ref={fileInputRef}
                  onChange={handleChange}
                />
              </Button>
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Box
              w={'full'}
              alignItems="center"
              display="flex"
              flexDirection="row"
              alignSelf={'flex-start'}
              justifyContent="space-between"
            >
              <Text color="fg.600">
                You can also email us at{' '}
                <Link href="mailto:support@zipper.works">
                  support@zipper.works
                </Link>
              </Text>
              <Button
                colorScheme="purple"
                isDisabled={submittingFeedback}
                onClick={async () => {
                  setSubmittingFeedback(true);

                  await contactSupportMutation.mutateAsync(
                    {
                      request: feedback,
                      file,
                    },
                    {
                      onSuccess: () => {
                        setFeedback('');
                      },
                    },
                  );

                  toast({
                    description: 'Your request has been sent!',
                    status: 'success',
                    duration: 9000,
                    isClosable: true,
                  });

                  analytics?.track('Contacted support', {
                    email: user?.email,
                  });

                  setSubmittingFeedback(false);
                  onClose();
                }}
              >
                {submittingFeedback ? <Spinner /> : 'Submit'}
              </Button>
            </Box>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
