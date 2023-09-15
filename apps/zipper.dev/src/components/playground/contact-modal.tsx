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
import { useAnalytics } from '~/hooks/use-analytics';
import { useUser } from '~/hooks/use-user';
import { trpc } from '~/utils/trpc';

export function ContactModal({
  isOpen,
  onOpen,
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
              <FormLabel>Contact our support team!</FormLabel>
              <Textarea onChange={(e) => setFeedback(e.target.value)} />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button
              colorScheme="purple"
              isDisabled={submittingFeedback}
              onClick={async () => {
                setSubmittingFeedback(true);

                await contactSupportMutation.mutateAsync({
                  request: feedback,
                });

                analytics?.track('Gave Feedback', {
                  email: user?.email,
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
