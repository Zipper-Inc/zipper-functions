// This is a bogus file
// Only here for testing
// Real applets will have real information from zipper.dev/api/bootInfo/[slug] at this path

export default {
  app: {
    id: 'fake-app-id',
    name: 'Example Applet',
    slug: 'example-applet',
    description: '',
    playgroundVersionHash: '65f4d2c9af374cf50fdb7936495ca7313a18aef2',
    publishedVersionHash: '784d4ef804796eb23798d3a5181a194c27ea1407',
    updatedAt: '2023-11-17T18:55:20.154Z',
    appAuthor: {
      name: 'Person',
      organization: '',
      image: 'https://avatars.githubusercontent.com/u/1039639?v=4',
      orgImage: '',
    },
    isDataSensitive: false,
    isPrivate: true,
    requiresAuthToRun: false,
    editors: [
      {
        userId: '3d5ebee3-e845-43f7-b795-2fd02bdb49b8',
        appId: '608da5a7-9358-44f3-a8ab-3183522ddd4c',
        isOwner: true,
      },
    ],
    organizationId: null,
  },
  inputs: [
    { key: 'url', type: 'string', optional: false },
    { key: 'format', type: 'string', optional: true },
  ],
  metadata: {},
  parsedScripts: {},
  runnableScripts: ['main.ts'],
  entryPoint: {
    filename: 'main.ts',
    editUrl: 'http://localhost:3000/zipper-inc/example-applet/src/main.ts',
  },
} as any;
