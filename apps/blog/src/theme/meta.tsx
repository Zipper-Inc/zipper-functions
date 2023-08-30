import NextLink from 'next/link';
import { ReactElement, useMemo } from 'react';
import { useBlogContext } from './blog-context';
import ThemeSwitch from './theme-switch';
import { split } from './utils/get-tags';
import { getParent } from './utils/parent';
import {
  Box,
  Flex,
  HStack,
  VStack,
  Link,
  Text,
  Heading,
} from '@chakra-ui/react';
import { FiFacebook, FiLinkedin, FiMail } from 'react-icons/fi';

export default function Meta(): ReactElement {
  const { opts, config } = useBlogContext();
  const { author, date, tag } = opts.frontMatter;
  const { back } = getParent({ opts, config });
  const tags = tag ? split(tag) : [];

  // const URL = `${router.defaultLocale}/${router.pathname}`;

  let URL = '';

  if (typeof window !== 'undefined') {
    URL = window.location.href;
  }

  const SOCIALS = useMemo(
    () => [
      {
        name: 'LinkedIn',
        icon: <FiLinkedin size={24} />,
        href: `https://www.linkedin.com/shareArticle?mini=true&url=${URL}`,
      },
      {
        name: 'Facebook',
        icon: <FiFacebook size={24} />,
        href: `https://www.facebook.com/sharer/sharer.php?u=${URL}`,
      },
      {
        name: 'E-mail',
        icon: <FiMail size={24} />,
        href: `mailto:?subject=Check%20out%20this%20link&body=${URL}`,
      },
    ],
    [URL],
  );

  const tagsEl = tags.map((t) => (
    <NextLink
      key={t}
      href="/tags/[tag]"
      as={`/tags/${t}`}
      passHref
      legacyBehavior
    >
      <Link
        px={4}
        py={1}
        border="gray.700"
        bg="gray.300"
        fontSize="sm"
        borderRadius="md"
      >
        #{t.replace(' ', '_')}
      </Link>
    </NextLink>
  ));

  const readingTime = opts.readingTime?.text;
  const dateObj = date ? new Date(date) : null;
  return (
    <VStack
      gap="3"
      align="start"
      className={
        'nx-mb-8 nx-flex nx-gap-3 ' +
        (readingTime ? 'nx-items-start' : 'nx-items-center')
      }
      mb={8}
    >
      <VStack align="start" flexGrow={1} gap={8} color="fg:600">
        <VStack
          align="start"
          className="nx-not-prose nx-flex nx-flex-wrap nx-items-center nx-gap-1"
        >
          <Heading as="h5" fontSize="14px">
            Published
          </Heading>
          <Text>
            {author}
            {author && date && ','}
            {dateObj && (
              <time dateTime={dateObj.toISOString()}>
                {config.dateFormatter?.(dateObj) || dateObj.toDateString()}
              </time>
            )}
            {/* {(author || date) && (readingTime || tags.length > 0) && (
            <span className="nx-px-1">•</span>
          )} */}
          </Text>

          {/* {readingTime || tagsEl} */}
        </VStack>
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

        <VStack align="start">
          <Heading as="h5" fontSize="14px">
            Tags
          </Heading>
          {tagsEl}
        </VStack>

        <VStack align="start">
          <Heading as="h5" fontSize="14px">
            Share this article
          </Heading>

          <HStack gap={2}>
            {SOCIALS.length > 0 &&
              SOCIALS.map((social, index) => (
                <Link key={index} isExternal href={social.href}>
                  {social.icon}
                </Link>
              ))}
          </HStack>
        </VStack>
      </VStack>
      {/* <HStack
        alignItems={'center'}
        className="nx-flex nx-items-center nx-gap-3 print:nx-hidden"
      >
        {back && (
          <NextLink href={back} passHref legacyBehavior>
            <a>Back</a>
          </NextLink>
        )}
        {config.darkMode && <ThemeSwitch />}
      </HStack> */}
    </VStack>
  );
}
