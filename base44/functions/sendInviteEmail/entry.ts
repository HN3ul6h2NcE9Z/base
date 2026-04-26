import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { firstName, lastName, email, role } = await req.json();

    if (!email) {
      return Response.json({ error: 'Missing email' }, { status: 400 });
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'scojetapps@scoapps.scojet.com',
        to: email,
        subject: `You've been invited to Scojet IT Project Tracker`,
        html: `
          <h2>Welcome to Scojet IT Project Tracker</h2>
          <p>Hi ${firstName || 'Scojet User'},</p>
          <p>You have been invited to join the <strong>Scojet IT Project Tracker</strong> as a <strong>${role}</strong>.</p>
          <p>Please check your inbox for a separate email with a link to complete your registration and set your password.</p>
          <p>Once registered, you'll be able to manage projects and tasks assigned to you.</p>
          <br/>
          <p>If you have any questions, please contact <a href="mailto:support@scojet.com">support@scojet.com</a>.</p>
          <p>Do not reply to this email.</p>
        `,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return Response.json({ error: result.message || 'Failed to send email' }, { status: response.status });
    }

    return Response.json({ success: true, id: result.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});