import { useOrganizationList } from '@clerk/nextjs';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  Input,
  FormLabel,
  FormHelperText,
  Icon,
  InputGroup,
  InputRightElement,
  Button,
} from '@chakra-ui/react';
import { HiX } from 'react-icons/hi';

import slugify from '~/utils/slugify';

import { trpc } from '~/utils/trpc';
import { CheckIcon } from '@chakra-ui/icons';
import { useDebounce } from 'use-debounce';
import { FormEventHandler, useEffect, useState } from 'react';
import { useRouter } from 'next/router';

const MIN_SLUG_LENGTH = 3;

export const CreateOrganizationModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const router = useRouter();

  const { setActive, createOrganization } = useOrganizationList();

  const [organizationName, setOrganizationName] = useState('');
  const [slugExists, setSlugExists] = useState<boolean | undefined>();
  const [slug, setSlug] = useState<string>('');
  const [debouncedSlug] = useDebounce(slug, 200);

  const organizationSlugQuery = trpc.useQuery(
    ['organizationSlug.find', { slug: debouncedSlug }],
    { enabled: !!(debouncedSlug.length > 2) },
  );

  const createOrganizationSlug = trpc.useMutation('organizationSlug.add');

  useEffect(() => {
    setSlugExists(!!organizationSlugQuery.data);
  }, [organizationSlugQuery.data]);

  useEffect(() => {
    const s = slugify(organizationName);
    setSlug(s);
  }, [organizationName]);

  const handleCreateOrgSubmit: FormEventHandler<HTMLFormElement> = async (
    e,
  ) => {
    e.preventDefault();
    if (!createOrganization) return;
    const newOrg = await createOrganization({ name: organizationName, slug });
    await createOrganizationSlug.mutateAsync(
      {
        slug,
        organizationId: newOrg.id,
      },
      {
        onError: (e) => {
          console.error(e);
        },
      },
    );
    setActive && setActive({ organization: newOrg.id });
    router.push(`${router.pathname}?reload=true`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleCreateOrgSubmit}>
          <ModalHeader>Create an Organization</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl>
              <FormLabel fontSize="sm">Organization account name</FormLabel>
              <InputGroup>
                <Input
                  type="text"
                  name="organizationName"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.currentTarget.value)}
                />
                {slug && slug.length >= MIN_SLUG_LENGTH && (
                  <InputRightElement
                    children={
                      slugExists ? (
                        <Icon as={HiX} color="red.500" />
                      ) : (
                        <CheckIcon color="green.500" />
                      )
                    }
                  />
                )}
              </InputGroup>

              {slugExists ? (
                <>
                  <FormHelperText>
                    {`The name ${slug} is already taken.`}
                  </FormHelperText>
                </>
              ) : (
                <>
                  {organizationName.length > 0 && slug && slug.length > 2 && (
                    <>
                      <FormHelperText>
                        This will be your account name on Zipper.
                      </FormHelperText>
                      <FormHelperText>{`The url for your organization will be: ${process.env.NEXT_PUBLIC_HOST}/${slug}`}</FormHelperText>
                    </>
                  )}

                  {organizationName.length > 0 &&
                    (!slug || slug.length < MIN_SLUG_LENGTH) && (
                      <>
                        <FormHelperText>
                          {`The name must contain at least ${MIN_SLUG_LENGTH} alphanumeric
                        characters.`}
                        </FormHelperText>
                      </>
                    )}
                </>
              )}
            </FormControl>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            <Button
              colorScheme="purple"
              type="submit"
              isDisabled={slugExists || slug.length < MIN_SLUG_LENGTH}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};
