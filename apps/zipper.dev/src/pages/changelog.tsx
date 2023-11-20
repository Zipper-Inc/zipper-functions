import {
  Divider,
  Heading,
  HStack,
  Spacer,
  Text,
  VStack,
} from '@chakra-ui/react';
import { NextPageWithLayout } from './_app';

import { useEffect, useState } from 'react';
import { Markdown } from '@zipper/ui';
import { initApplet } from '@zipper-inc/client-js';

const ChangelogPage: NextPageWithLayout = () => {
  const [changelogEntries, setChangelogEntries] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const entries = await initApplet('zipper-changelog').run('get');
      setChangelogEntries(entries);
    })();
  }, []);

  return (
    <HStack
      spacing={0}
      flex={1}
      alignItems="start"
      gap={{ base: 8, sm: 16 }}
      px={{ base: 4, sm: 10 }}
      flexDirection={{ base: 'column', sm: 'row' }}
    >
      <VStack flex={1} alignItems="stretch">
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
                w={{ sm: 'prose' }}
              >
                <Text fontSize="sm" fontFamily="mono">
                  {new Date(entry.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
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
