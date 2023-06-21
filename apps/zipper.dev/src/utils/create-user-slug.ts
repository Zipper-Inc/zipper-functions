import slugify from 'slugify';
import { prisma } from '~/server/prisma';
import crypto from 'crypto';

export const createUserSlug = async ({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}) => {
  const possibleSlugs: string[] = [];
  const emailUserPart = email.split('@')[0];

  if (emailUserPart && emailUserPart.length >= 3) {
    possibleSlugs.push(slugify(emailUserPart));
  }
  if (name) {
    possibleSlugs.push(slugify(name));
  }

  const alternativeSlugs = possibleSlugs.map(
    (s) => `${s}-${Math.floor(Math.random() * 100)}`,
  );
  alternativeSlugs.push(slugify(email));

  const existingResourceOwnerSlugs = await prisma.resourceOwnerSlug.findMany({
    where: { slug: { in: [...possibleSlugs, ...alternativeSlugs] } },
  });

  const existingSlugs = existingResourceOwnerSlugs.map((s) => s.slug);

  const validSlugs = [...possibleSlugs, ...alternativeSlugs].filter((s) => {
    return !existingSlugs.includes(s);
  });

  const slug = validSlugs[0] || crypto.randomBytes(4).toString('hex');

  return slug;
};
