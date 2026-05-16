# Agent Action Registry

**Expose safe, structured frontend actions for AI agents.**

[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## The Problem

Most SaaS products were built for humans clicking dashboards. AI agents need structured actions, permissions, and predictable execution.

Without an action registry, AI agents are forced to:
- Parse and interact with raw DOM elements
- Guess at side effects and validation rules
- Navigate complex UI flows built for humans
- Risk executing unsafe operations

**Agent Action Registry** provides a structured, type-safe way to expose frontend actions to AI agents. Define what actions are available, what inputs they require, what permissions they need, and exactly how they should execute.

---

## Features

- **Type-safe action definitions** with full TypeScript support
- **Input validation** for string, number, boolean, enum, and object types
- **Permission-based access control** to protect sensitive operations
- **Structured execution results** with success/error states
- **React integration** with Context and hooks
- **Minimal dependencies** and simple API
- **Full test coverage** for core functionality

---

## Installation

```bash
# Core package
npm install agent-action-registry

# React integration
npm install @agent-action-registry/react
```

---

## Quick Start

### Basic Usage

```typescript
import { registerAction, executeAction } from 'agent-action-registry';

// Register an action
registerAction({
  id: 'create_invoice',
  name: 'Create Invoice',
  description: 'Creates an invoice for a customer',
  inputs: {
    customerId: {
      type: 'string',
      required: true,
      description: 'Customer ID'
    },
    amount: {
      type: 'number',
      required: true,
      description: 'Invoice amount'
    }
  },
  permissions: ['billing:write'],
  handler: async ({ customerId, amount }) => {
    // Your implementation here
    return {
      invoiceId: '12345',
      status: 'created'
    };
  }
});

// Execute the action
const result = await executeAction(
  'create_invoice',
  { customerId: 'cust-123', amount: 500 },
  { permissions: ['billing:write'] }
);

if (result.success) {
  console.log('Invoice created:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### React Usage

```tsx
import { AgentActionsProvider, useAgentActions } from '@agent-action-registry/react';
import { useEffect } from 'react';

function App() {
  return (
    <AgentActionsProvider
      context={{
        userId: 'user-123',
        permissions: ['tasks:write', 'orders:read']
      }}
    >
      <Dashboard />
    </AgentActionsProvider>
  );
}

function Dashboard() {
  const { registerAction, executeAction, actions } = useAgentActions();

  useEffect(() => {
    registerAction({
      id: 'create_task',
      name: 'Create Task',
      description: 'Creates a new task',
      inputs: {
        title: { type: 'string', required: true }
      },
      permissions: ['tasks:write'],
      handler: async ({ title }) => {
        return { taskId: '123', title };
      }
    });
  }, [registerAction]);

  const handleCreateTask = async () => {
    const result = await executeAction('create_task', {
      title: 'New Task'
    });

    if (result.success) {
      console.log('Task created:', result.data);
    }
  };

  return (
    <div>
      <h1>Available Actions: {actions.length}</h1>
      <button onClick={handleCreateTask}>Create Task</button>
    </div>
  );
}
```

---

## API Reference

### Core Package

#### `registerAction(action: Action)`

Registers a new action in the default registry.

```typescript
registerAction({
  id: 'action_id',
  name: 'Action Name',
  description: 'What this action does',
  inputs: {
    fieldName: {
      type: 'string' | 'number' | 'boolean' | 'enum' | 'object',
      required: boolean,
      description: 'Field description',
      enum?: string[], // For enum type
      properties?: { ... } // For object type
    }
  },
  permissions?: string[],
  handler: async (input, context) => {
    // Implementation
    return result;
  }
});
```

#### `executeAction(id, input, context?)`

Executes an action with input validation and permission checks.

```typescript
const result = await executeAction(
  'action_id',
  { field: 'value' },
  {
    userId: 'user-123',
    permissions: ['permission:scope']
  }
);

// Result structure:
{
  success: boolean;
  data?: any;
  error?: string;
  actionId: string;
}
```

#### `getActions()`

Returns all registered actions.

#### `getAction(id)`

Returns a specific action by ID.

#### `unregisterAction(id)`

Removes an action from the registry.

### React Package

#### `<AgentActionsProvider>`

Wraps your app to provide action registry context.

```tsx
<AgentActionsProvider
  registry={customRegistry} // optional
  context={{ permissions: ['...'] }} // optional default context
>
  {children}
</AgentActionsProvider>
```

#### `useAgentActions()`

Hook to access the action registry.

```typescript
const {
  actions,           // All registered actions
  registerAction,    // Register a new action
  unregisterAction,  // Remove an action
  getAction,         // Get action by ID
  executeAction      // Execute an action
} = useAgentActions();
```

---

## Safety Model

Agent Action Registry implements multiple layers of safety:

### 1. Input Validation

All inputs are validated against their schema before execution:

```typescript
inputs: {
  email: {
    type: 'string',
    required: true
  },
  age: {
    type: 'number',
    required: true
  },
  role: {
    type: 'enum',
    enum: ['admin', 'user', 'guest'],
    required: true
  }
}
```

### 2. Permission Checks

Actions can require specific permissions that are checked before execution:

```typescript
{
  permissions: ['admin:write', 'users:delete'],
  handler: async (input, context) => {
    // Only executes if context.permissions includes all required permissions
  }
}
```

### 3. Structured Error Handling

All errors are caught and returned in a structured format:

```typescript
if (!result.success) {
  console.log(result.error); // Human-readable error message
  console.log(result.actionId); // Which action failed
}
```

### 4. Type Safety

Full TypeScript support ensures type safety at compile time:

```typescript
interface CreateTaskInput {
  title: string;
  priority: 'low' | 'medium' | 'high';
}

const action: Action<CreateTaskInput, { taskId: string }> = {
  // Fully typed
};
```

---

## Demo

This repository includes a full demo application showing a fake SaaS dashboard with registered actions:

```bash
cd agent-action-registry
npm install
npm run dev
```

The demo includes:
- **Task Management**: Create and view tasks
- **Order Filtering**: Filter orders by status
- **CSV Export**: Export filtered data
- **Purchase Order Approval**: Approve pending orders
- **Agent Console**: Interactive UI to execute any registered action

---

## Use Cases

### Customer Support Agent
```typescript
registerAction({
  id: 'refund_order',
  name: 'Refund Order',
  description: 'Issues a refund for a customer order',
  inputs: {
    orderId: { type: 'string', required: true },
    reason: { type: 'string', required: true }
  },
  permissions: ['support:refunds'],
  handler: async ({ orderId, reason }) => {
    // Process refund
  }
});
```

### Analytics Agent
```typescript
registerAction({
  id: 'generate_report',
  name: 'Generate Report',
  description: 'Generates a custom analytics report',
  inputs: {
    startDate: { type: 'string', required: true },
    endDate: { type: 'string', required: true },
    metrics: {
      type: 'object',
      properties: {
        revenue: { type: 'boolean' },
        users: { type: 'boolean' }
      }
    }
  },
  permissions: ['analytics:read'],
  handler: async (input) => {
    // Generate report
  }
});
```

### Workflow Automation Agent
```typescript
registerAction({
  id: 'approve_workflow',
  name: 'Approve Workflow',
  description: 'Approves a pending workflow step',
  inputs: {
    workflowId: { type: 'string', required: true },
    approvalNote: { type: 'string', required: false }
  },
  permissions: ['workflows:approve'],
  handler: async ({ workflowId, approvalNote }) => {
    // Approve workflow
  }
});
```

---

## Roadmap

This is an experimental open-source project. Future improvements may include:

- [ ] **Action Discovery Protocol**: Standardized format for AI agents to discover available actions
- [ ] **Rate Limiting**: Built-in rate limiting per action or user
- [ ] **Audit Logging**: Automatic logging of all action executions
- [ ] **Action Versioning**: Support for multiple versions of the same action
- [ ] **Middleware System**: Pre/post execution hooks
- [ ] **Action Composition**: Chain multiple actions together
- [ ] **OpenAPI Export**: Generate OpenAPI specs from registered actions
- [ ] **Undo/Redo**: Support for reversible actions
- [ ] **Dry Run Mode**: Test actions without side effects
- [ ] **Action Templates**: Pre-built common actions
- [ ] **WebSocket Support**: Real-time action execution updates
- [ ] **Multi-tenant Support**: Isolate actions per tenant

---

## Development

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm run test

# Run demo
npm run dev
```

---

## Contributing

Contributions are welcome! This is an experimental project exploring how to make SaaS products more agent-native.

Please feel free to:
- Report bugs
- Suggest features
- Submit pull requests
- Share your use cases

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Philosophy

Traditional software was built for humans with:
- Visual interfaces designed for eyes
- Click flows optimized for mouse interaction
- Implicit rules learned through exploration

AI agents need software with:
- Structured actions with explicit schemas
- Permission systems that can be programmatically verified
- Predictable execution with clear success/failure states

**Agent Action Registry** is a primitive for this new paradigm. It's a small library that helps you expose your existing applications to AI agents in a safe, structured way.

This is experimental software. We're learning what patterns work best for agent-native applications. Your feedback and contributions will shape the future of this project.

---

**Built with the belief that the future of software is collaborative between humans and AI agents.**
