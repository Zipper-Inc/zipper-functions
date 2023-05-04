import { UseQueryResult } from 'react-query';
import { inferQueryOutput } from '~/utils/trpc';

export type AppQueryOutput = inferQueryOutput<'app.byResourceOwnerAndAppSlugs'>;
export type AppUseQueryResult = UseQueryResult<AppQueryOutput>;

export type AppEventsQueryOutput = inferQueryOutput<'appEvent.all'>;
export type AppEventUseQueryResult = UseQueryResult<AppEventsQueryOutput>;
