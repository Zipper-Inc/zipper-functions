import { NextApiHandler } from 'next';

const handler: NextApiHandler = (_, res) =>
  res.status(200).end(JSON.stringify({ ok: true, lastHealthy: new Date() }));

export default handler;
