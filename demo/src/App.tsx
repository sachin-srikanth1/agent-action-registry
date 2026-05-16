import { AgentActionsProvider } from '@agent-action-registry/react';
import Dashboard from './components/Dashboard';
import AgentConsole from './components/AgentConsole';
import './App.css';

function App() {
  const mockContext = {
    userId: 'user-123',
    permissions: ['tasks:write', 'orders:read', 'orders:export', 'billing:write']
  };

  return (
    <AgentActionsProvider context={mockContext}>
      <div className="app">
        <header className="app-header">
          <h1>Agent Action Registry Demo</h1>
          <p>A fake SaaS dashboard with AI-ready actions</p>
        </header>
        <div className="app-content">
          <Dashboard />
          <AgentConsole />
        </div>
      </div>
    </AgentActionsProvider>
  );
}

export default App;
