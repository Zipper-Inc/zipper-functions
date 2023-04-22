import { chromium } from 'playwright';

export default async function handler(req, res) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const path = req.url.replace('api/png', 'run');

  const runUrl = `${proto}://${host}${path}`;

  const selector = '#smart-function-output';
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({
    width: 1920,
    height: 1280,
    deviceScaleFactor: 2,
  });
  await page.goto(runUrl);
  const output = page.locator(selector);
  await output.waitFor();
  const buffer = await output.screenshot({ scale: 'css' });
  await browser.close();

  res.setHeader('Content-Type', 'image/png');
  res.end(buffer, 'binary');
}
