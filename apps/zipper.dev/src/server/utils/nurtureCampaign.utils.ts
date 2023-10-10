import { queues } from '../queue';
import { resend } from '../resend';

export const startNurtureCampaign = (email: string) => {
  const hour = 1000 * 60 * 60;

  queues.nurture.addBulk([
    {
      name: 'first-nurture-email',
      data: { step: 1, email },
      // opts: { delay: hour / 4 },
      opts: { delay: hour / 60 },
    },
    {
      name: 'second-nurture-email',
      data: { step: 2, email },
      // opts: { delay: hour * 24 },
      opts: { delay: (hour / 60) * 2 },
    },
  ]);
};

const STEP_ONE_CONTENT = `Hey there,

We just wanted to drop you a quick note to say thank you for checking out Zipper.

If you have any questions, feedback, or general comments, we'd genuinely love to hear them. Feel free to reply to this email at any point - your emails go directly into our inboxes (and not a general mailbox or support queue).

Regards,
Sachin & Ibu
`;

const STEP_TWO_CONTENT = `This is the second email!`;

export const sendNurtureEmail = async (step: 1 | 2, email: string) => {
  switch (step) {
    case 1:
      await resend.emails.send({
        to: email,
        from: 'Sachin & Ibu <founders@zipper.dev>',
        reply_to: ['sachin@zipper.works', 'ibu@zipper.works'],
        subject: 'Thank you for checking out Zipper',
        text: STEP_ONE_CONTENT,
      });

      break;
    case 2:
      await resend.emails.send({
        to: email,
        from: 'Zipper <yourfriends@zipper.dev>',
        reply_to: ['sachin@zipper.works', 'ibu@zipper.works'],
        subject: 'What can you build?',
        text: STEP_TWO_CONTENT,
      });
      break;
    default:
      throw new Error('invalid nurture step');
  }
};
