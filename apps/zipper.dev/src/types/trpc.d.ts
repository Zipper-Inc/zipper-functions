import { UseQueryResult } from 'react-query';
import { inferQueryOutput } from '~/utils/trpc';

export type AppQueryOutput = inferQueryOutput<'app.byResourceOwnerAndAppSlugs'>;
export type AppUseQueryResult = UseQueryResult<AppQueryOutput>;
