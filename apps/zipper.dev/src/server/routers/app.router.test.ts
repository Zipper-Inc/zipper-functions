import { createContextInner } from '../context';
import { AppRouter, trpcRouter } from './_app';
import { inferProcedureInput } from '@trpc/server';
import { prismaMock } from '../../../jestSetup';
import { randomUUID } from 'crypto';
import { App, Script } from '@prisma/client';
import { defaultCode } from './app.router';

let userId: string;
let orgId: string;
let appId: string;

describe('when calling app.add', () => {
  beforeEach(() => {
    userId = randomUUID();
    orgId = randomUUID();
    appId = randomUUID();
    prismaMock.app.findMany.mockResolvedValue([]);
  });

  it('makes the correct prisma db call', async () => {
    const ctx = createContextInner({ userId });
    const caller = trpcRouter.createCaller(ctx);

    const input: inferProcedureInput<
      AppRouter['_def']['mutations']['app.add']
    > = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    await caller.mutation('app.add', input);

    expect(prismaMock.app.create).toBeCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: userId,
          description: 'test',
          editors: {
            create: {
              isOwner: true,
              userId: userId,
            },
          },
          name: 'test',
          organizationId: undefined,
          slug: 'test',
        }),
      }),
    );
  });

  it('uses the orgId in the context if one isnt provided', async () => {
    const ctx = createContextInner({ userId, orgId });
    const caller = trpcRouter.createCaller(ctx);

    const input: inferProcedureInput<
      AppRouter['_def']['mutations']['app.add']
    > = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    await caller.mutation('app.add', input);

    expect(prismaMock.app.create).toBeCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: userId,
          description: 'test',
          editors: {
            create: {
              isOwner: true,
              userId: userId,
            },
          },
          name: 'test',
          organizationId: orgId,
          slug: 'test',
        }),
      }),
    );
  });

  it('finds a unique app slug', async () => {
    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);
    prismaMock.app.findMany.mockResolvedValue([{ slug: 'test' } as App]);

    const ctx = createContextInner({ userId, orgId });
    const caller = trpcRouter.createCaller(ctx);

    const input: inferProcedureInput<
      AppRouter['_def']['mutations']['app.add']
    > = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    await caller.mutation('app.add', input);

    expect(prismaMock.app.create).toBeCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: userId,
          description: 'test',
          editors: {
            create: {
              isOwner: true,
              userId: userId,
            },
          },
          name: 'test',
          organizationId: orgId,
          slug: 'test-12',
        }),
      }),
    );
  });

  it('fails if the user is not authed', async () => {
    const ctx = createContextInner({});
    const caller = trpcRouter.createCaller(ctx);

    const input: inferProcedureInput<
      AppRouter['_def']['mutations']['app.add']
    > = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    expect(caller.mutation('app.add', input)).rejects.toThrowError(
      'UNAUTHORIZED',
    );
  });

  it.todo('accepts a organization id');
});
