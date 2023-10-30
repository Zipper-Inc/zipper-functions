import { Flex } from '@chakra-ui/react';
import { ZipperLocation } from '@zipper/types';
import React, { useRef } from 'react';
import stripJs from 'strip-js';
import { useSmartFunctionOutputContext } from './smart-function-output-context';

export function HtmlOutput({
  config,
  data,
}: {
  config: Zipper.HandlerConfig;
  data: string;
}) {
  const { __dangerouslyAllowScripts } = config as Zipper.HandlerConfig & {
    __dangerouslyAllowScripts: boolean;
  };

  const { location, outputSection } = useSmartFunctionOutputContext();
  const ref = useRef<HTMLDivElement>(null);

  const height =
    location === ZipperLocation.ZipperDotDev &&
    ref.current &&
    outputSection === 'main'
      ? `calc(100vh - ${ref.current.getBoundingClientRect().top}px - 30px)`
      : '100%';

  const srcDoc = __dangerouslyAllowScripts ? data : stripJs(data);

  return (
    <Flex height={height} width="full" ref={ref}>
      <iframe height="100%" width="100%`" srcDoc={srcDoc} />
    </Flex>
  );
}
