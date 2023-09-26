import { UseQueryResult } from '@tanstack/react-query';
import { RouterOutputs } from '~/utils/trpc';

export type AppQueryOutput = RouterOutputs['app']['byResourceOwnerAndAppSlugs'];
export type AppUseQueryResult = UseQueryResult<AppQueryOutput>;
