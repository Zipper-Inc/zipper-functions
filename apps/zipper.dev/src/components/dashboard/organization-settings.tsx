import {
  FormControl,
  FormLabel,
  Input,
  FormHelperText,
  HStack,
  Button,
  Heading,
  VStack,
  Text,
  Box,
  Divider,
} from '@chakra-ui/react';
import { getZipperDotDevUrl } from '@zipper/utils';
import { useState, useEffect } from 'react';
import { useOrganization } from '~/hooks/use-organization';
import { trpc } from '~/utils/trpc';

function OrganizationSettings() {
  const [disabled, setDisabled] = useState(false);
  const { organization } = useOrganization();
  const [orgName, setOrgName] = useState(organization?.name || '');
  const organizationSlugQuery = trpc.useQuery(
    [
      'resourceOwnerSlug.findByOrganizationId',
      { organizationId: organization?.id || '' },
    ],
    { enabled: !!organization },
  );

  useEffect(() => {
    setOrgName(organization?.name || '');
  }, [organization?.name]);

  const handleOrgNameSubmit = async (e: any) => {
    e.preventDefault();
    setDisabled(true);
    await organization?.update({ name: orgName });
    setDisabled(false);
  };
  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16}>
      <VStack flex={1} alignItems="stretch">
        <HStack pb="4">
          <Heading as="h6" fontWeight={400}>
            Settings
          </Heading>
        </HStack>
        <Text mb="4">Manage settings for this organization</Text>
      </VStack>
      <VStack align="stretch" flex={3} pb="10">
        <Box w="100%">
          <Text fontSize={'xl'}>General</Text>
          <Divider mb="4" mt={2} />
        </Box>
        <form onSubmit={handleOrgNameSubmit}>
          <FormControl>
            <FormLabel size="sm">Organization Name</FormLabel>
            <Input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            ></Input>
            <FormHelperText>
              {`This is the display name for your organization. It does not change
            the url: ${getZipperDotDevUrl().origin}/${
                organizationSlugQuery.data?.slug
              }`}
            </FormHelperText>
          </FormControl>
          <HStack justifyContent={'end'} w="full">
            <Button type="submit" colorScheme="purple" isDisabled={disabled}>
              Save
            </Button>
          </HStack>
        </form>
      </VStack>
    </HStack>
  );
}

export default OrganizationSettings;
