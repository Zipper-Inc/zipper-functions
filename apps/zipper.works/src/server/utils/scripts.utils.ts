import { Script } from '@prisma/client';
import { createHash } from 'crypto';

async function generateHash(opts: Script): Promise<string>;
async function generateHash(opts: {
  code: string;
  appId: string;
  name: string;
  description?: string;
}): Promise<string>;

async function generateHash(opts: any) {
  // generate a sha256 hash from the script code, appId, name, and description
  const hashable = `${opts.code}${opts.appId}${opts.name}${opts.description}`;
  return createHash('sha256').update(hashable).digest('hex');
}

export const createScriptHash = generateHash;
