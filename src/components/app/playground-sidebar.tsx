import {
  Button,
  HStack,
  Link,
  Text,
  VStack,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverBody,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { VscCode } from 'react-icons/vsc';
import NextLink from 'next/link';
import React, { Fragment } from 'react';
import AddScriptForm from '~/components/app/add-script-form';

import { Script } from '@prisma/client';

export function PlaygroundSidebar({
  app,
  isUserAnAppEditor,
  currentScript,
  mainScript,
}: {
  app: any;
  isUserAnAppEditor: boolean;
  currentScript: Script;
  mainScript: Script;
}) {
  const sortScripts = (a: any, b: any) => {
    let orderA;
    let orderB;

    // always make sure `main` is on top, respect order after
    if (a.id === mainScript?.id) orderA = -Infinity;
    else orderA = a.order === null ? Infinity : a.order;
    if (b.id === mainScript?.id) orderB = -Infinity;
    else orderB = b.order === null ? Infinity : b.order;
    return orderA > orderB ? 1 : -1;
  };

  return (
    <>
      <VStack alignItems="start" gap={1}>
        <HStack w="full">
          <VscCode />
          <Text size="sm" color="gray.500" flexGrow={1}>
            Functions
          </Text>
          {isUserAnAppEditor && (
            <Popover>
              <PopoverTrigger>
                <Button variant="link">
                  <AddIcon color="gray.500" height={3} />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverArrow />
                <PopoverBody>
                  <AddScriptForm
                    connectors={app.connectors}
                    scripts={app.scripts}
                    appId={app.id}
                  />
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
        </HStack>
        {app.scripts.sort(sortScripts).map((script: any) => (
          <Fragment key={script.id}>
            <NextLink href={`/app/${app.id}/edit/${script.filename}`} passHref>
              <Link
                fontSize="sm"
                fontWeight="light"
                w="100%"
                px={2}
                background={
                  currentScript?.id === script.id ? 'purple.100' : 'transparent'
                }
                borderRadius={2}
              >
                <Text fontWeight={'semibold'}>{script.filename}</Text>
              </Link>
            </NextLink>
          </Fragment>
        ))}
      </VStack>
    </>
  );
}
