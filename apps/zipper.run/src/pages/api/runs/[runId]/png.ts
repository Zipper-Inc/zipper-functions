import { ZIPPER_TEMP_USER_ID_COOKIE_NAME } from '@zipper/utils';
import { chromium } from 'playwright';
import type { NextApiRequest, NextApiResponse } from 'next';
import getRunInfo from '~/utils/get-run-info';
import getValidSubdomain from '~/utils/get-valid-subdomain';
import { getZipperAuth } from '~/utils/get-zipper-auth';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../../../../utils/s3';

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

        // upload to s3
        const s3Key = `${appId}/${runId}.png`;
        s3Client.send(
          new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_SCREENSHOTS_BUCKET_NAME,
            Key: s3Key,
            Body: buffer,
          }),
        );

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `inline; filename="${runId}.png"`);
        res.end(buffer, 'binary');
      }
    }
  } catch (e) {
    console.error(e);
    await browser.close();
    res.status(500).end();
  }
}
