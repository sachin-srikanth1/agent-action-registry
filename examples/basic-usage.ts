import { registerAction, executeAction } from 'agent-action-registry';

registerAction({
  id: 'send_email',
  name: 'Send Email',
  description: 'Sends an email to a user',
  inputs: {
    to: {
      type: 'string',
      required: true,
      description: 'Recipient email address'
    },
    subject: {
      type: 'string',
      required: true,
      description: 'Email subject'
    },
    body: {
      type: 'string',
      required: true,
      description: 'Email body content'
    },
    priority: {
      type: 'enum',
      enum: ['low', 'normal', 'high'],
      required: false,
      description: 'Email priority'
    }
  },
  permissions: ['email:send'],
  handler: async ({ to, subject, body, priority = 'normal' }) => {
    console.log(`Sending email to ${to}...`);
    return {
      messageId: 'msg-123',
      status: 'sent',
      to,
      subject,
      priority
    };
  }
});

async function main() {
  const result = await executeAction(
    'send_email',
    {
      to: 'user@example.com',
      subject: 'Welcome!',
      body: 'Thanks for joining.',
      priority: 'high'
    },
    {
      permissions: ['email:send']
    }
  );

  if (result.success) {
    console.log('Email sent successfully:', result.data);
  } else {
    console.error('Failed to send email:', result.error);
  }
}

main();
