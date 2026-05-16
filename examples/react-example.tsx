import React, { useEffect, useState } from 'react';
import { AgentActionsProvider, useAgentActions } from '@agent-action-registry/react';

function EmailManager() {
  const { registerAction, executeAction } = useAgentActions();
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
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
        }
      },
      permissions: ['email:send'],
      handler: async ({ to, subject, body }) => {
        return {
          messageId: 'msg-' + Date.now(),
          status: 'sent',
          to,
          subject
        };
      }
    });
  }, [registerAction]);

  const handleSendEmail = async () => {
    setStatus('Sending...');

    const result = await executeAction('send_email', {
      to: 'user@example.com',
      subject: 'Hello!',
      body: 'This is a test email.'
    });

    if (result.success) {
      setStatus(`Email sent! Message ID: ${result.data.messageId}`);
    } else {
      setStatus(`Error: ${result.error}`);
    }
  };

  return (
    <div>
      <h1>Email Manager</h1>
      <button onClick={handleSendEmail}>Send Test Email</button>
      <p>{status}</p>
    </div>
  );
}

function App() {
  return (
    <AgentActionsProvider
      context={{
        userId: 'user-123',
        permissions: ['email:send', 'email:read']
      }}
    >
      <EmailManager />
    </AgentActionsProvider>
  );
}

export default App;
