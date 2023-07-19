import NextLink from 'next/link';
import type { ReactElement } from 'react';
import { useBlogContext } from './blog-context';
import ThemeSwitch from './theme-switch';
import { split } from './utils/get-tags';
import { getParent } from './utils/parent';
import { Box, Flex, HStack, VStack, Link } from '@chakra-ui/react';

export default function Meta(): ReactElement {
  const { opts, config } = useBlogContext();
  const { author, date, tag } = opts.frontMatter;
  const { back } = getParent({ opts, config });
  const tags = tag ? split(tag) : [];

  const tagsEl = tags.map((t) => (
    <NextLink
      key={t}
      href="/tags/[tag]"
      as={`/tags/${t}`}
      passHref
      legacyBehavior
    >
      <Link>{t}</Link>
    </NextLink>
  ));

  const readingTime = opts.readingTime?.text;
  const dateObj = date ? new Date(date) : null;
  return (
    <HStack
      gap="3"
      className={
        'nx-mb-8 nx-flex nx-gap-3 ' +
        (readingTime ? 'nx-items-start' : 'nx-items-center')
      }
      mb={8}
    >
      <HStack flexGrow={1} color="fg:600">
        <Flex
          gap={1}
          className="nx-not-prose nx-flex nx-flex-wrap nx-items-center nx-gap-1"
        >
          {author}
          {author && date && ','}
          {dateObj && (
            <time dateTime={dateObj.toISOString()}>
              {config.dateFormatter?.(dateObj) || dateObj.toDateString()}
            </time>
          )}
          {(author || date) && (readingTime || tags.length > 0) && (
            <span className="nx-px-1">•</span>
          )}
          {readingTime || tagsEl}
        </Flex>
        {readingTime && (
          <Flex
            gap="1"
            mt={1}
            flexWrap={'wrap'}
            className="nx-not-prose nx-mt-1 nx-flex nx-flex-wrap nx-items-center nx-gap-1"
          >
            {tagsEl}
          </Flex>
        )}
      </HStack>
      <HStack
        alignItems={'center'}
        className="nx-flex nx-items-center nx-gap-3 print:nx-hidden"
      >
        {back && (
          <NextLink href={back} passHref legacyBehavior>
            <a>Back</a>
          </NextLink>
        )}
        {config.darkMode && <ThemeSwitch />}
      </HStack>
    </HStack>
  );
}
