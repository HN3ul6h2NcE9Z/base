import { Resend } from 'resend';

const resend = new Resend('re_fnstiAad_BDVjiAKQgG7YHyjHxWPmhEKA');

await resend.emails.send({
  from: 'DEV: Scojet apps <support@scoapps.scojet.com>',
  to: ['nhamilton@scojet.com'],
  subject: 'hello world',
  html: '<p>it works!</p>',
});
