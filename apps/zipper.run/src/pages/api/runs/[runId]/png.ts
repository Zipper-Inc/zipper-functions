import { chromium } from 'playwright';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const { runId } = req.query;
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

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `inline; filename="${runId}.png"`);
      res.end(buffer, 'binary');
    }
  } catch (e) {
    console.error(e);
    await browser.close();
    res.status(500).end();
  }
}
