import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { taskTitle, assignedTo, projectName, priority, startDate, endDate, isNew } = await req.json();

    if (!assignedTo) {
      return Response.json({ message: 'No assignee, skipping.' });
    }

    const users = await base44.asServiceRole.entities.User.list();
    const assignedUser = users.find(u => u.email === assignedTo);
    const assignedFirstName = assignedUser?.first_name || 'User';

    const action = isNew ? 'assigned to' : 'reassigned to';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'scojetapps@scoapps.scojet.com',
        to: assignedTo,
        subject: `Scojet Task Notification: You've been ${action} "${taskTitle}"`,
        html: `
          <h2>Task ${isNew ? 'Assignment' : 'Reassignment'}</h2>
          <p>Hi ${assignedFirstName},</p>
          <p>You have been ${action} the task: <strong>${taskTitle}</strong>.</p>
          ${projectName ? `<p><strong>Project:</strong> ${projectName}</p>` : ''}
          ${priority ? `<p><strong>Priority:</strong> ${priority}</p>` : ''}
          ${startDate ? `<p><strong>Start Date:</strong> ${new Date(startDate).toLocaleDateString()}</p>` : ''}
          ${endDate ? `<p><strong>Due Date:</strong> ${new Date(endDate).toLocaleDateString()}</p>` : ''}
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