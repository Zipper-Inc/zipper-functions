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
} from '@chakra-ui/react';
import { useState } from 'react';
import { trpc } from '~/utils/trpc';

export function FeedbackModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const [feedback, setFeedback] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const feedbackMutation = trpc.user.submitFeedback.useMutation();

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
          <ModalHeader>What's going on?</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel>Share your feedback</FormLabel>
              <Textarea onChange={(e) => setFeedback(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="purple"
              isDisabled={submittingFeedback}
              onClick={async () => {
                setSubmittingFeedback(true);
                await feedbackMutation.mutateAsync({
                  feedback,
                  url: window.location.href,
                });

                setSubmittingFeedback(false);
                onClose();
              }}
            >
              {submittingFeedback ? <Spinner /> : 'Submit'}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
