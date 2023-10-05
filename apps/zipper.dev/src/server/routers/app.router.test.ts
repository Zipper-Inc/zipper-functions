import { App } from '@prisma/client';
import { inferRouterInputs } from '@trpc/server';
import { randomUUID } from 'crypto';
import { prismaMock } from '../../../jestSetup';
import { createContextInner } from '../context';
import { AppRouter, trpcRouter } from './_app';

let userId: string;
let orgId: string;
let appId: string;

describe('when calling app.add', () => {
  beforeEach(() => {
    userId = randomUUID();
    orgId = randomUUID();
    appId = randomUUID();
    prismaMock.organizationMembership.count.mockResolvedValue(1);
    prismaMock.app.findMany.mockResolvedValue([]);
  });

  it('makes the correct prisma db call', async () => {
    const ctx = createContextInner({ userId });
    const caller = trpcRouter.createCaller(ctx);

    const input: inferRouterInputs<AppRouter>['app']['add'] = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    await caller.app.add(input);

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

    const input: inferRouterInputs<AppRouter>['app']['add'] = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    await caller.app.add(input);

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

    const input: inferRouterInputs<AppRouter>['app']['add'] = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    await caller.app.add(input);

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

  // it('creates a main.ts file and sets it as the entry point', async () => {
  //   prismaMock.app.findMany.mockResolvedValue([{ slug: 'test' } as App]);

  //   const ctx = createContextInner({ userId, orgId });
  //   const caller = trpcRouter.createCaller(ctx);

  //   const input: inferProcedureInput<
  //     AppRouter['_def']['mutations']['app.add']
  //   > = {
  //     name: 'test',
  //     description: 'test',
  //     slug: 'test',
  //   };

  //   const scriptId = randomUUID();

  //   prismaMock.app.create.mockResolvedValue({ id: appId } as App);
  //   prismaMock.scriptMain.create.mockResolvedValue({
  //     appId,
  //     scriptId: scriptId,
  //     scripts: [
  //       {
  //         id: scriptId,
  //       },
  //     ],
  //   } as ScriptMain & { scripts: Script[] });

  //   const output = await caller.mutation('app.add', input);

  //   expect(prismaMock.scriptMain.create).toBeCalledWith(
  //     expect.objectContaining({
  //       data: {
  //         app: { connect: { id: appId } },
  //         script: expect.objectContaining({
  //           create: {
  //             name: 'main',
  //             filename: 'main.ts',
  //             code: defaultCode,
  //             appId,
  //             order: 0,
  //             isRunnable: true,
  //           },
  //         }),
  //       },
  //     }),
  //   );

  //   expect(output).toEqual({
  //     id: appId,
  //     scriptMain: {
  //       appId: appId,
  //       scriptId,
  //       scripts: [
  //         {
  //           id: scriptId,
  //         },
  //       ],
  //     },
  //   });
  // });

  it('fails if the user is not authed', async () => {
    const ctx = createContextInner({});
    const caller = trpcRouter.createCaller(ctx);

    const input: inferRouterInputs<AppRouter>['app']['add'] = {
      name: 'test',
      description: 'test',
      slug: 'test',
    };

    expect(caller.app.add(input)).rejects.toThrowError('UNAUTHORIZED');
  });

  it.todo('accepts a organization id');
});
