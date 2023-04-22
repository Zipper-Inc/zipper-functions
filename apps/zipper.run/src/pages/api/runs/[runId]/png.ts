import { chromium } from 'playwright';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const { runId } = req.query;
  const path = `/run/${runId}`;
  console.log(path);

  const runUrl = `${proto}://${host}${path}`;

  const selector = '#smart-function-output';
  const browser = await chromium.launch();
  const context = await browser.newContext({ deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.setViewportSize({
    width: 1920,
    height: 1280,
  });
  await page.goto(runUrl);
  const output = page.locator(selector);
  await output.waitFor();
  const buffer = await output.screenshot({ scale: 'css' });
  await browser.close();

  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Disposition', `inline; filename="${runId}.png"`);
  res.end(buffer, 'binary');
}
