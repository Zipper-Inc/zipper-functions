import {
  Divider,
  Heading,
  HStack,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { TITLE_COLUMN_MIN_WIDTH } from '~/components/playground/constants';
import { NextPageWithLayout } from './_app';

import { useEffect, useState } from 'react';
import { Markdown } from '@zipper/ui';

const ChangelogPage: NextPageWithLayout = () => {
  const [changelogEntries, setChangelogEntries] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const res = await fetch('https://zipper-changelog.zipper.run/get/api');
      const entries = await res.json();
      setChangelogEntries(entries.data);
    })();
  }, []);

  console.log(changelogEntries);
  return (
    <HStack spacing={0} flex={1} alignItems="start" gap={16} px={10}>
      <VStack flex={1} alignItems="stretch" minW={TITLE_COLUMN_MIN_WIDTH}>
        <Heading as="h6" pb="4" fontWeight={400}>
          Changelog
        </Heading>
        <Text color="fg.600" pb="4" whiteSpace="pre-line">
          The latest updates and changes to Zipper
        </Text>
      </VStack>
      <VStack>
        {changelogEntries.map((entry) => {
          return (
            <>
              <VStack
                align="start"
                key={entry.id}
                _notFirst={{ pt: '10' }}
                pb="10"
                w="prose"
              >
                <Text fontSize="sm" fontFamily="mono">
                  {entry.date.split('T')[0]}
                </Text>
                <Markdown>{entry.content}</Markdown>
                <details>
                  <summary style={{ paddingTop: '1rem', fontWeight: '500' }}>
                    Fixes and improvements
                  </summary>
                  <Markdown>{entry.fixes}</Markdown>
                </details>
              </VStack>
              <Divider />
            </>
          );
        })}
      </VStack>
      <Spacer />
    </HStack>
  );
};

ChangelogPage.skipAuth = true;
export default ChangelogPage;
