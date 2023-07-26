import proxy from 'express-http-proxy';
import express, { RequestHandler } from 'express';

const PORT = 9999;

const app = express();

/**
 * A simple express proxy so that we can handle subdomains in render previews locally
 * i.e. applet-name.zipper-run-preview.localdev.me
 */
const previewProxy: RequestHandler = (req, res, next) => {
  // i.e. zipper-run-preview.localdev.me
  // or   applet-name.zipper-run-preview.localdev.me
  const hostnameParts = req.hostname.split('.');

  if (hostnameParts.length < 3) return res.send('🤷🏽‍♂️ Not sure what to proxy');

  // Remove the last two parts of the hostname
  // i.e. ['localdev, 'me']
  hostnameParts.splice(-2);

  // last part of the array is unique render hostname
  // i.e. zipper-run-preview
  const renderSubdomain = hostnameParts.splice(-1);
  req.headers['x-preview-proxy-host'] = req.hostname;
  return proxy(`https://${renderSubdomain}.onrender.com`, {
    memoizeHost: false,
    userResHeaderDecorator: (headers) => ({
      'x-preview-proxy-host': req.hostname,
      ...headers,
    }),
  })(req, res, next);
};

app.use(previewProxy);

app.listen(PORT, () => {
  console.log(`🥽 Started the preview proxy on ${PORT}`);
});
