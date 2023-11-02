export function getScreenshotUrl(urlToScreenshot: string): string {
  const imgUrl = new URL('https://api.urlbox.io/v1/yp9laCbg58Haq8m1/png');
  imgUrl.searchParams.set('url', urlToScreenshot);
  imgUrl.searchParams.set('thumb_width', '1200');
  return imgUrl.toString();
}
