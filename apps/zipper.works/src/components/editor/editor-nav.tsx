import {
  Heading,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
  Tag,
} from '@chakra-ui/react';
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
      <Tabs colorScheme="whiteAlpha">
        <TabList>
          <Tab>Main</Tab>
          <Tab>Start Here</Tab>
        </TabList>
        <TabPanels marginTop={6}>
          <TabPanel padding={0}>
            <VStack spacing={1} alignItems="stretch">
              {app.scripts.map((script) => (
                <Fragment key={script.id}>
                  <Tag
                    colorScheme="blackAlpha"
                    color="white"
                    fontWeight={600}
                    w="fit-content"
                    paddingX={3}
                    paddingY={2}
                  >
                    {script.filename}
                  </Tag>
                </Fragment>
              ))}
            </VStack>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
};
