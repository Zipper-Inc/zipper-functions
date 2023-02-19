import { Heading, VStack, Tag } from '@chakra-ui/react';
import { inferQueryOutput } from '~/utils/trpc';

type EditorNavProps = {
  app: Unpack<inferQueryOutput<'app.byResourceOwnerAndAppSlugs'>>;
};

export const EditorNav: React.FC<EditorNavProps> = ({ app }) => {
  return (
    <>
      <Heading as="h2" fontSize="xl" color="white">
        {app.name}
      </Heading>
      <VStack spacing={1} alignItems="start">
        {app.scripts.map((script) => (
          <Tag
            key={script.id}
            colorScheme="blackAlpha"
            color="white"
            fontWeight={600}
            paddingX={3}
            paddingY={2}
            _hover={{ transform: 'scale(1.05)' }}
            onClick={() => {
              window.location.href = `/${app.resourceOwner.slug}/${app.slug}/edit/${script.filename}`;
            }}
          >
            {script.filename}
          </Tag>
        ))}
      </VStack>
    </>
  );
};
