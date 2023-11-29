import type { NextApiRequest, NextApiResponse } from 'next';
import { Pool } from 'pg';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { connectionString } = req.body;
  const pool = new Pool({
    connectionString,
  });

  try {
    await pool.query('SELECT NOW()');
    res.status(200).json({ message: 'Connection successful' });
  } catch (error) {
    res.status(500).json({ message: 'Connection failed', error });
  }
}
