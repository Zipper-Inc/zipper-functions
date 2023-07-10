import { Heading, VStack, Tag } from '@chakra-ui/react';
import { inferQueryOutput } from '~/utils/trpc';

type EditorNavProps = {
  app: Unpack<inferQueryOutput<'app.byResourceOwnerAndAppSlugs'>>;
};

export const EditorPreviewNav: React.FC<EditorNavProps> = ({ app }) => {
  const scriptMain = app.scripts.find(
    (script) => script.filename === 'main.ts',
  );
  return (
    <>
      <Heading as="h2" fontSize="xl" color="bgColor">
        {app.name}
      </Heading>
      <VStack spacing={1} alignItems="start">
        {scriptMain && (
          <Tag
            key={scriptMain.id}
            colorScheme="blackAlpha"
            color="bgColor"
            fontWeight={600}
            paddingX={3}
            paddingY={2}
            _hover={{ transform: 'scale(1.05)' }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/${app.resourceOwner.slug}/${app.slug}/edit/${scriptMain.filename}`;
            }}
          >
            {scriptMain.filename}
          </Tag>
        )}

        {app.scripts
          .filter((script) => script.filename !== 'main.ts')
          .sort((a, b) => {
            return ('' + a.filename).localeCompare(b.filename);
          })
          .map((script) => (
            <Tag
              key={script.id}
              colorScheme="blackAlpha"
              color="bgColor"
              fontWeight={600}
              paddingX={3}
              paddingY={2}
              _hover={{ transform: 'scale(1.05)' }}
              onClick={(e) => {
                e.preventDefault();
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
