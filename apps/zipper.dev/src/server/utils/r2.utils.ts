import s3Client from '../s3';
import JSZip from 'jszip';
import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Script } from '@prisma/client';

export async function getVersionCode({
  appId,
  version,
}: {
  appId: string;
  version: string;
}) {
  const zipFile = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_APPLET_SRC_BUCKET_NAME,
      Key: `${appId}/${version}.zip`,
    }),
  );

  if (!zipFile || !zipFile.Body) {
    throw new Error('No zip file found');
  }

  const versionScripts: Omit<Script, 'id' | 'order'>[] = [];
  const versionZip = new JSZip();

  await versionZip.loadAsync(zipFile.Body.transformToByteArray());

  const promises: Promise<string | void>[] = [];

  // you now have every files contained in the loaded zip
  versionZip.forEach(async (relativePath, zipEntry) => {
    promises.push(
      zipEntry.async('string').then((content) => {
        const jsonContent = JSON.parse(content);

        versionScripts.push({
          appId,
          filename: jsonContent.filename,
          code: jsonContent.code,
          hash: jsonContent.hash,
          isRunnable: jsonContent.isRunnable,
          createdAt: jsonContent.createdAt,
          updatedAt: jsonContent.updatedAt,
          name: jsonContent.name,
          connectorId: jsonContent.connectorId,
        });
      }),
    );
  });

  await Promise.all(promises);

  return versionScripts;
}

export async function getVersionESZip({
  appId,
  version,
}: {
  appId: string;
  version: string;
}) {
  const foundFile = await s3Client.send(
    new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUILD_FILE_BUCKET_NAME,
      Key: `${appId}/${version}`,
    }),
  );
  const byteArray = await foundFile.Body?.transformToByteArray();

  if (byteArray) {
    console.log('found file on cloudflare');
    return Buffer.from(byteArray);
  }

  return undefined;
}

export async function storeVersionESZip({
  appId,
  version,
  eszip,
}: {
  appId: string;
  version: string;
  eszip: Buffer;
}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUILD_FILE_BUCKET_NAME,
      Key: `${appId}/${version}`,
      Body: eszip,
    }),
  );
}

export async function storeVersionCode({
  appId,
  version,
  zip,
}: {
  appId: string;
  version: string;
  zip: Uint8Array;
}) {
  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_APPLET_SRC_BUCKET_NAME,
      Key: `${appId}/${version}.zip`,
      Body: zip,
    }),
  );
}
