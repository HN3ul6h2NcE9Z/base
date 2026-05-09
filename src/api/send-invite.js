import 'dotenv/config';
import { Resend } from 'resend';

const resend = new Resend('re_fnstiAad_BDVjiAKQgG7YHyjHxWPmhEKA');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  try {
    await resend.emails.send({
      from: 'DEV: Scojet apps <support@scoapps.scojet.com>',
      to: ['nhamilton@scojet.com'],
      subject: 'TESTING: Welcome to the Scojet IT Project Portal - From the web',
      html:
        `<p>Hello <b>Nicole</b>,</p>` +
        `<br>You have been invited to the Scojet IT Portal. Click the link below to accept your invite.` +
        `<br><i>[placeholder to be inserted]</i><br><br>` +
        `Questions? Contact Support.` +
        `<br><a href="mailto:support@scojet.com">Scojet Support</a>`,
    });
    console.log('Email sent:', result);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Resend error:', error);
    return res.status(500).json({ success: false });
  }
}
