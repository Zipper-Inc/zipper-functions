import { useMemo } from 'react';
import {
  TableContainer,
  Table,
  Thead,
  Th,
  Tbody,
  Tr,
  Td,
  Box,
  Text,
  Flex,
} from '@chakra-ui/react';
import { OutputType } from '@zipper/types';
import styled from '@emotion/styled';

import { useTable, useSortBy } from 'react-table';
import { ObjectExplorer } from './object-explorer';
import { isPrimitive, parseResult } from './utils';
import { RawFunctionOutput } from './raw-function-output';
import { HiCheck, HiX } from 'react-icons/hi';
import { ActionComponent } from './action-component';
import { RouterComponent } from './router-component';
import SmartFunctionOutputProvider from './smart-function-output-context';
import Collection from './collection';
import Array from './array';

export function SmartFunctionOutput({
  result,
  level = 0,
}: {
  result: any;
  level?: number;
}) {
  if (!result) return null;

  const { type, data } = parseResult(result);

  switch (type) {
    case OutputType.String:
      return <Text fontSize="2xl">{data.toString()}</Text>;

    case OutputType.Array:
      return <Array data={data} />;

    case OutputType.Collection:
      return <Collection data={data} />;

    case OutputType.Html:
      return (
        <Box>
          <iframe width="100%" height="400px" srcDoc={data} />
        </Box>
      );

    case OutputType.Object:
      return <ObjectExplorer data={data} level={level} />;

    case OutputType.Action: {
      if (data.run === undefined) data.run = true;
      return <ActionComponent action={data} />;
    }

    case OutputType.Router:
      return <RouterComponent route={data} />;

    case OutputType.ActionArray:
      return (
        <Flex direction="row">
          {data.map((action: any) => (
            <ActionComponent action={action} />
          ))}
        </Flex>
      );

    default:
      return <RawFunctionOutput result={result} />;
  }
}
