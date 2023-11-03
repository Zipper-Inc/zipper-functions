export function getScreenshotUrl(urlToScreenshot: string): string {
  const imgUrl = new URL(
    process.env.NEXT_PUBLIC_ZIPPER_SCREENSHOTS_URL ||
      'https://screenshots.zipper.run',
  );
  imgUrl.searchParams.set('url', urlToScreenshot);
  imgUrl.searchParams.set('format', 'png');
  imgUrl.searchParams.set('thumb_width', '1200');
  return imgUrl.toString();
}
