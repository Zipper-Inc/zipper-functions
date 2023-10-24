import { Resend } from 'resend';

export const resend = new Resend(
  process.env.NODE_ENV === 'test' ? 'abc123' : process.env.RESEND_API_KEY!,
);
