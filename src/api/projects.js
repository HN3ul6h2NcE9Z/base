import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const projectData = req.body;

  // 1️⃣ Create the project (DB logic placeholder)
  // await db.projects.create(projectData);

  // 2️⃣ Send the email ✅
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

  return res.status(200).json({ success: true });
}