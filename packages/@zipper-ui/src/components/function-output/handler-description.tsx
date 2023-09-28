import { Heading, VStack } from '@chakra-ui/react';
import { AppInfo } from '@zipper/types';
import { Markdown } from './markdown';

type HandlerDescription = {
  title?: string;
  subtitle?: string;
  body?: string;
};

type Props = {
  applet?: AppInfo;
  config?: Zipper.HandlerConfig;
  filename?: string;
  description?: HandlerDescription;
};

export const getDescription = ({ applet, config, filename }: Props) => {
  const hasConfigDescription = Object.values(config?.description || {}).find(
    (truthy) => !!truthy,
  );
  const { title, subtitle, body } = {
    title: applet?.name,
    subtitle: filename && filename !== 'main.ts' && filename.replace('.ts', ''),
    body:
      !hasConfigDescription && filename === 'main.ts' && applet?.description,
    ...config?.description,
  };

  if (title || subtitle || body)
    return { title, subtitle, body } as HandlerDescription;
};

export function HandlerDescription(props: Props) {
  const description = props.description || getDescription(props);
  if (!description) return null;

  const { title, subtitle, body } = description;

  return (
    <VStack align="start" width="full">
      {title && (
        <Heading as="h1" fontSize="4xl" fontWeight="medium">
          {title}
        </Heading>
      )}
      {subtitle && (
        <Heading as="h2" fontSize="xl" fontWeight="normal" color="fg.600">
          {subtitle}
        </Heading>
      )}
      {body && <Markdown>{body}</Markdown>}
    </VStack>
  );
}
