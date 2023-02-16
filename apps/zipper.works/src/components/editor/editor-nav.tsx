import { Heading, VStack, Tag, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { Fragment } from 'react';
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
      <VStack spacing={1} alignItems="stretch">
        {app.scripts.map((script) => (
          <Fragment key={script.id}>
            <Link
              as={NextLink}
              href={`/${app.resourceOwner.slug}/${app.slug}/edit/${script.filename}`}
              _hover={{ textDecoration: 'none', transform: 'scale(1.05)' }}
              minWidth={0}
            >
              <Tag
                colorScheme="blackAlpha"
                color="white"
                fontWeight={600}
                paddingX={3}
                paddingY={2}
              >
                {script.filename}
              </Tag>
            </Link>
          </Fragment>
        ))}
      </VStack>
    </>
  );
};
