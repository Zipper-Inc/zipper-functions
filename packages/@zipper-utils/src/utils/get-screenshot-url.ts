export function getScreenshotUrl(
  urlToScreenshot: string,
  selector?: string,
): string {
  const imgUrl = new URL(
    process.env.NEXT_PUBLIC_ZIPPER_SCREENSHOTS_URL ||
      'https://screenshots.zipper.run/main.ts',
  );
  imgUrl.searchParams.set('url', urlToScreenshot);
  imgUrl.searchParams.set('format', 'png');
  imgUrl.searchParams.set('thumb_width', '1200');
  if (selector) {
    imgUrl.searchParams.set('selector', selector);
  }
  return imgUrl.toString();
}
