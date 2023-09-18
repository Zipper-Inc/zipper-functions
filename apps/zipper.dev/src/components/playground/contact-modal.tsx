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
} from '@chakra-ui/react';
import Link from 'next/link';
import { useState } from 'react';
import { FiClipboard } from 'react-icons/fi';
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

  // we need to create a new function here to make the request client side
  // we need to send a multipart-form data request with the file

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
                _hover={{ bgColor: 'transparent' }}
                display="flex"
                alignItems={'center'}
                alignContent={'center'}
                justifyContent={'center'}
                p={0}
                gap={2}
              >
                <PiPaperclipDuotone />
                <Text color="fg.600">Add an images, files or videos</Text>
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
                    },
                    {
                      onSuccess: () => {
                        setFeedback('');
                      },
                    },
                  );

                  analytics?.track('Gave Feedback', {
                    email: user?.email,
                  });

                  setSubmittingFeedback(false);
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
