import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { data, old_data, event } = await req.json();

    // For updates, only send if owner actually changed
    if (event?.type === 'update' && old_data?.owner === data?.owner) {
      return Response.json({ message: 'Owner unchanged, skipping notification.' });
    }

    const ownerEmail = data?.owner;
    if (!ownerEmail) {
      return Response.json({ message: 'No owner email, skipping notification.' });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const ownerUser = users.find(u => u.email === ownerEmail);
    const ownerFirstName = ownerUser?.first_name || 'User';
    const projectName = data?.name || 'A new project';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'scojetapps@scoapps.scojet.com',
        to: ownerEmail,
        subject: `Scojet Project Notification: You've been assigned as owner of "${projectName}"`,
        html: `
          <h2>New Project Assigned</h2>
          <p>Hi ${ownerFirstName},</p>
          <p>You have been listed as the owner of the project: <strong>${projectName}</strong>.</p>
          ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
          ${data.priority ? `<p><strong>Priority:</strong> ${data.priority}</p>` : ''}
          ${data.start_date ? `<p><strong>Start Date:</strong> ${new Date(data.start_date).toLocaleDateString()}</p>` : ''}
          ${data.end_date ? `<p><strong>End Date:</strong> ${new Date(data.end_date).toLocaleDateString()}</p>` : ''}
          <p>Log in to view more details.</p>
          <p>Do not reply to this email, but contact support@scojet.com for additional information.</p>
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