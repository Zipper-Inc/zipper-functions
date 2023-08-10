import { GetObjectCommand } from '@aws-sdk/client-s3';
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '~/server/prisma';
import s3Client from '~/server/s3';
import { getAppVersionFromHash } from '~/utils/hashing';
import { Parser } from '@deno/eszip';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { query } = req;

  const appId = Array.isArray(query.appId) ? query.appId[0] : query.appId;
  const version = Array.isArray(query.version)
    ? query.version[0]
    : query.version;
  const filename = Array.isArray(query.filename)
    ? query.filename[0]
    : query.filename;

  if (!appId)
    throw new Error(
      "No app id so I can't look up the app and get you source code",
    );

  if (!filename)
    throw new Error("No filename so I can't look up the source code for you");

  const app = await prisma.app.findFirst({
    where: { id: appId, isPrivate: false },
    include: { scripts: true },
  });

  if (!app) throw new Error('No app found. Maybe your gave me a bad app id?');

  const loweredQueryFilename = filename.toLowerCase();
  console.log(loweredQueryFilename);

  if (
    version === 'latest' ||
    version === getAppVersionFromHash(app.playgroundVersionHash)
  ) {
    const script = app.scripts.find((script) => {
      const loweredScriptFilename = script.filename.toLowerCase();
      return (
        loweredScriptFilename === loweredQueryFilename ||
        loweredScriptFilename === `${loweredQueryFilename}.ts`
      );
    });

    if (!script)
      throw new Error(
        'No script found. Maybe your gave me the wrong filename?',
      );

    res.setHeader('Content-Type', 'text/typescript');

    res.send(script.code);
  } else {
    let eszip: Buffer | undefined;
    const foundFile = await s3Client.send(
      new GetObjectCommand({
        Bucket: process.env.CLOUDFLARE_BUILD_FILE_BUCKET_NAME,
        Key: `${app.id}/${version}`,
      }),
    );
    const byteArray = await foundFile.Body?.transformToByteArray();

    if (byteArray) {
      console.log('found file on cloudflare');
      eszip = Buffer.from(byteArray);
    }

    if (eszip) {
      Parser.createInstance().then(async (parser) => {
        const specifiers = await parser.parseBytes(eszip!);
        await parser.load();
        const specifier = specifiers.find((specifier: string) =>
          specifier.endsWith(`applet/src/${filename}.tsx`),
        );
        res.send(await parser.getModuleSource(specifier));
        res.setHeader('Content-Type', 'text/typescript');
      });
    }
  }
}
