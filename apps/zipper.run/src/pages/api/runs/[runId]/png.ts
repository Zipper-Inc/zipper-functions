import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { chromium } from 'playwright';
import type { NextApiRequest, NextApiResponse } from 'next';
import getRunInfo from '~/utils/get-run-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getZipperAuth } from '~/utils/get-zipper-auth';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_ACCESS_KEY_SECRET!,
  },
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const { runId } = req.query as { runId: string };
  const path = `/run/history/${runId}`;
  console.log(path);

  const runUrl = `${proto}://${host}${path}`;

  const selector = '[data-function-output="smart"]';
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setViewportSize({
    width: 390, //1920,
    height: 844, //1280,
  });

  try {
    const response = await page.goto(runUrl);
    if (!response) {
      console.log('No response');
      await browser.close();
      res.status(500).end();
    } else if (response.status() !== 200) {
      console.log(`HTTP ${response.status()}: Couldn't load ${runUrl}`);
      await browser.close();
      res.status(404).end();
    } else {
      const output = page.locator(selector);
      await output.waitFor();
      const buffer = await output.screenshot({ scale: 'device' });
      await browser.close();

      // validate subdomain
      const { host } = req.headers;

      // validate subdomain
      const subdomain = getValidSubdomain(host);
      if (!subdomain) return { notFound: true };

      const { token } = await getZipperAuth(req);

      // grab the app if it exists
      const result = await getRunInfo({
        subdomain,
        token,
        runId,
        tempUserId: req.cookies[ZIPPER_TEMP_USER_ID_COOKIE_NAME],
      });
      if (result.ok) {
        const appId = result.data.app.id;
        const s3Key = `${appId}/${runId}.png`;
        const objectParams = {
          Bucket: process.env.CLOUDFLARE_SCREENSHOTS_BUCKET_NAME,
          Key: s3Key,
        };

        // check for existing screenshot on s3
        try {
          await s3Client.send(new HeadObjectCommand(objectParams));
        } catch (e) {
          // upload to s3
          await s3Client.send(
            new PutObjectCommand({
              ...objectParams,
              Body: buffer,
              ContentType: 'image/png',
            }),
          );
        }

        const url = await getSignedUrl(
          // @ts-ignore-next-line
          s3Client,
          new GetObjectCommand({
            ...objectParams,
            ResponseContentDisposition: `inline; filename="zipper-run-${runId}.png"`,
          }),
          { expiresIn: 3600 },
        );

        console.log(url);

        return res.redirect(302, url);
      }
    }
  } catch (e) {
    console.error(e);
    await browser.close();
    res.status(500).end();
  }
}
