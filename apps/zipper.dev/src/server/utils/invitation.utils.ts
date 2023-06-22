import crypto from 'crypto';
import { prisma } from '../prisma';
import { Resend } from 'resend';
import { InvitationEmail } from '~/../emails';
import { resend } from '../resend';

/**
 * Only sends the email - does not create the org invitation or pending app editor
 */

export async function sendInvitationEmail({
  email,
  resourceToJoinName,
  callbackUrl,
}: {
  email: string;
  resourceToJoinName: string;
  callbackUrl: string;
}) {
  const token = crypto.randomBytes(16).toString('hex');

  const hash = crypto
    .createHash('sha256')
    // Prefer provider specific secret, but use default secret if none specified
    .update(`${token}${process.env.NEXTAUTH_SECRET}`)
    .digest('hex');

  await prisma.verificationToken.create({
    data: {
      token: hash,
      identifier: email,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    },
  });
  await resend.emails.send({
    to: email,
    from: 'Zipper <yourfriends@zipper.dev>',
    subject: `[Zipper] You've been invited to join ${resourceToJoinName}`,
    react: InvitationEmail({
      loginUrl: `${
        process.env.NEXT_PUBLIC_ZIPPER_DOT_DEV_URL
      }/api/auth/callback/email?${new URLSearchParams({
        token: token,
        email: email,
        callbackUrl,
      })}`,
      resourceToJoinName,
    }),
  });
}
