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
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { VscCode, VscTypeHierarchy } from 'react-icons/vsc';
import NextLink from 'next/link';
import React, { Fragment } from 'react';
import { trpc } from '~/utils/trpc';
import { connectors } from '~/config/connectors';
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
  const utils = trpc.useContext();

  const addScript = trpc.useMutation('script.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['script.byAppId', { appId: app.id }]);
    },
  });

  const addAppConnector = trpc.useMutation('appConnector.add', {
    async onSuccess() {
      // refetches posts after a post is added
      await utils.invalidateQueries(['app.byId', { id: app.id }]);
    },
  });

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
      <VStack alignItems="start" gap={2}>
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
                <PopoverCloseButton />
                <PopoverHeader>Add a function</PopoverHeader>
                <PopoverBody>
                  <AddScriptForm scripts={app.scripts} appId={app.id} />
                </PopoverBody>
              </PopoverContent>
            </Popover>
          )}
        </HStack>
        {app.scripts
          .sort(sortScripts)
          .filter((s: Script) => !s.connectorId)
          .map((script: any) => (
            <Fragment key={script.id}>
              <NextLink
                href={`/app/${app.id}/edit/${script.filename}`}
                passHref
              >
                <Link
                  fontSize="sm"
                  fontWeight="light"
                  w="100%"
                  px={2}
                  background={
                    currentScript?.id === script.id
                      ? 'purple.100'
                      : 'transparent'
                  }
                  borderRadius={2}
                >
                  <b>{script.filename}</b>
                </Link>
              </NextLink>
            </Fragment>
          ))}
      </VStack>
      <VStack align="start" gap="2" mt="10">
        <HStack w="full">
          <VscTypeHierarchy />
          <Text size="sm" color="gray.500" flexGrow={1}>
            Connectors
          </Text>
        </HStack>

        {isUserAnAppEditor &&
          connectors.map((connector) => {
            if (!app.connectors.find((c: any) => c.type === connector.id)) {
              return (
                <Link
                  key={connector.id}
                  fontSize="sm"
                  onClick={() => {
                    addAppConnector.mutateAsync({
                      appId: app.id,
                      type: connector.id,
                    });

                    addScript.mutateAsync({
                      name: `${connector.id}-connector`,
                      code: connector.code,
                      appId: app.id,
                      order: app.scripts.length + 1,
                      connectorId: connector.id,
                    });
                  }}
                >
                  + Add {connector.name}
                </Link>
              );
            }
          })}

        {app.scripts
          .filter((s: Script) => s.connectorId)
          .map((script: any) => (
            <Fragment key={script.id}>
              <NextLink
                href={`/app/${app.id}/edit/${script.filename}`}
                passHref
              >
                <Link
                  fontSize="sm"
                  fontWeight="light"
                  w="100%"
                  px={2}
                  background={
                    currentScript?.id === script.id
                      ? 'purple.100'
                      : 'transparent'
                  }
                  borderRadius={2}
                >
                  <b>
                    Configure{' '}
                    {connectors.find((c) => c.id === script.connectorId)?.name}
                  </b>
                </Link>
              </NextLink>
            </Fragment>
          ))}
      </VStack>
    </>
  );
}
