import { Flex, Stack, Avatar, Text } from '@chakra-ui/react';

type AppletAuthor = {
  name: string;
  image?: string;
  orgImage?: string;
  organization?: string;
};

type Props = {
  author: AppletAuthor;
};

export const AppletAuthor: React.FC<Props> = ({ author }) => {
  const { name, image, orgImage, organization } = author;
  return (
    <>
      <Flex direction="row" gap={4} alignItems="center">
        <Stack direction="row">
          <Avatar src={image} size="xs" name={name} />
          <Text fontSize="14">
            by <strong>{name}</strong>
          </Text>
        </Stack>
        {organization && (
          <Stack direction="row">
            <Avatar src={orgImage} size="xs" name={organization} />
            <Text fontSize="14" fontWeight="bold">
              {organization ? `${organization}` : ''}
            </Text>
          </Stack>
        )}
      </Flex>
    </>
  );
};
