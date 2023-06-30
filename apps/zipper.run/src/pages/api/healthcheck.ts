import { NextApiHandler } from 'next';

const HEALTHCHECK_APPLET_URL = 'https://healthcheck.zipper.run/relay';

const handler: NextApiHandler = async (_, res) => {
  const relayResponse = await fetch(HEALTHCHECK_APPLET_URL);
  const relayResponseBody = await relayResponse.text();
  return res.status(relayResponse.status).end(relayResponseBody);
};

export default handler;
