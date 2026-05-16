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
- **Action logging** - Track all executions with timestamps, inputs, outputs, and performance metrics
- **Rollback/Undo** - Reversible actions with automatic history tracking
- **Dry-run evaluation** - Validate actions before execution without side effects
- **React integration** with Context and hooks
- **Minimal dependencies** and simple API
- **Full test coverage** for core functionality (23 passing tests)

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

#### `evaluate(actionId, input, context?)`

Evaluates an action without executing it.

```typescript
const evaluation = evaluate('action_id', { field: 'value' }, context);

// Returns:
{
  valid: boolean;
  errors: string[];
  warnings: string[];
}
```

#### `rollback(actionId?)`

Rolls back the last action or a specific action by ID.

```typescript
await rollback(); // Undo last action
await rollback('action-log-id'); // Undo specific action
```

#### `getLogs(filter?)`

Returns action execution logs.

```typescript
const logs = getLogs();
const filtered = getLogs({ actionId: 'create_task', success: true });
```

#### `getHistory()`

Returns rollback history.

#### `canRollback()`

Checks if any action can be rolled back.

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
  executeAction,     // Execute an action
  evaluate,          // Evaluate action without executing
  rollback,          // Rollback last or specific action
  getLogs,           // Get execution logs
  getHistory,        // Get rollback history
  canRollback        // Check if rollback is available
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

## Advanced Features

### Action Logging

Track all action executions with detailed logs including timestamps, user context, inputs, outputs, and performance metrics.

```typescript
import { ActionRegistry, MemoryLogger, ConsoleLogger } from 'agent-action-registry';

// Option 1: Memory logger (stores in memory)
const logger = new MemoryLogger(1000); // Keep last 1000 logs
const registry = new ActionRegistry({ logger });

// Option 2: Console logger (logs to console + memory)
const consoleLogger = new ConsoleLogger();
const registry2 = new ActionRegistry({ logger: consoleLogger });

// Register and execute actions
registerAction({ /* ... */ });
await executeAction('action-id', { /* ... */ });

// Get all logs
const allLogs = getLogs();

// Filter logs
const userLogs = getLogs({ userId: 'user-123' });
const failedLogs = getLogs({ success: false });
const actionLogs = getLogs({ actionId: 'create_task' });

// Get stats (MemoryLogger only)
const stats = logger.getStats();
// { total, successful, failed, successRate, avgDuration }
```

Each log entry includes:
- `id`: Unique log ID
- `actionId`: The action that was executed
- `actionName`: Human-readable action name
- `timestamp`: When it executed
- `userId`: User who executed it (if in context)
- `input`: Input data
- `result`: Execution result
- `duration`: Execution time in milliseconds
- `context`: Full execution context

### Rollback/Undo

Make actions reversible by defining rollback handlers. The registry automatically tracks execution history.

```typescript
import { ActionRegistry, MemoryRollbackManager } from 'agent-action-registry';

const rollbackManager = new MemoryRollbackManager(100); // Keep last 100 actions
const registry = new ActionRegistry({ rollbackManager });

registerAction({
  id: 'create_invoice',
  name: 'Create Invoice',
  description: 'Creates an invoice',
  inputs: {
    customerId: { type: 'string', required: true },
    amount: { type: 'number', required: true }
  },
  handler: async ({ customerId, amount }) => {
    const invoice = await createInvoice(customerId, amount);
    return { invoiceId: invoice.id };
  },
  // Define how to undo this action
  rollbackHandler: async (result, input) => {
    await deleteInvoice(result.invoiceId);
  }
});

// Execute action
await executeAction('create_invoice', { customerId: 'cust-123', amount: 500 });

// Check if rollback is available
if (canRollback()) {
  // Undo the last action
  await rollback();
}

// Rollback a specific action by ID
await rollback('action-log-id');

// Get rollback history
const history = getHistory();
```

**Important**: Only actions with a `rollbackHandler` can be undone. Actions without rollback handlers are still tracked but cannot be rolled back.

### Dry-Run Evaluation

Validate actions before execution without side effects.

```typescript
import { evaluate, executeAction } from 'agent-action-registry';

// Evaluate without executing
const evaluation = evaluate('create_invoice', {
  customerId: 'cust-123',
  amount: 500
}, {
  permissions: ['billing:write']
});

if (evaluation.valid) {
  console.log('Action is valid!');
  if (evaluation.warnings.length > 0) {
    console.warn('Warnings:', evaluation.warnings);
  }

  // Now execute for real
  await executeAction('create_invoice', { /* ... */ });
} else {
  console.error('Validation errors:', evaluation.errors);
}

// Or use dry-run mode
const result = await executeAction('create_invoice', {
  customerId: 'cust-123',
  amount: 500
}, undefined, { dryRun: true });

// result.data.evaluation contains validation results
// result.data.dryRun === true
```

Evaluation checks:
- Input validation (types, required fields)
- Permission requirements
- Missing context
- Extra fields (warnings only)

### React Integration with Advanced Features

```tsx
import { AgentActionsProvider, useAgentActions } from '@agent-action-registry/react';
import { ActionRegistry, MemoryLogger, MemoryRollbackManager } from 'agent-action-registry';

// Create registry with advanced features
const logger = new MemoryLogger();
const rollbackManager = new MemoryRollbackManager();
const registry = new ActionRegistry({ logger, rollbackManager });

function App() {
  return (
    <AgentActionsProvider registry={registry} context={{ userId: 'user-123', permissions: ['...'] }}>
      <Dashboard />
    </AgentActionsProvider>
  );
}

function Dashboard() {
  const {
    executeAction,
    evaluate,
    rollback,
    canRollback,
    getLogs,
    getHistory
  } = useAgentActions();

  const handleExecute = async () => {
    // Evaluate first
    const eval = evaluate('create_task', { title: 'New Task' });

    if (eval.valid) {
      // Execute
      const result = await executeAction('create_task', { title: 'New Task' });

      if (result.success) {
        console.log('Task created!');
        console.log('Execution logs:', getLogs());
        console.log('Can undo:', canRollback());
      }
    }
  };

  const handleUndo = async () => {
    if (canRollback()) {
      await rollback();
      console.log('Action undone!');
    }
  };

  return (
    <div>
      <button onClick={handleExecute}>Execute Action</button>
      <button onClick={handleUndo} disabled={!canRollback()}>Undo Last Action</button>
    </div>
  );
}
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

This is an experimental open-source project. Completed features:

- [x] **Audit Logging**: Automatic logging of all action executions ✅
- [x] **Undo/Redo**: Support for reversible actions ✅
- [x] **Dry Run Mode**: Test actions without side effects ✅

Future improvements may include:

- [ ] **Action Discovery Protocol**: Standardized format for AI agents to discover available actions
- [ ] **Rate Limiting**: Built-in rate limiting per action or user
- [ ] **Action Versioning**: Support for multiple versions of the same action
- [ ] **Middleware System**: Pre/post execution hooks
- [ ] **Action Composition**: Chain multiple actions together
- [ ] **OpenAPI Export**: Generate OpenAPI specs from registered actions
- [ ] **Action Templates**: Pre-built common actions
- [ ] **WebSocket Support**: Real-time action execution updates
- [ ] **Multi-tenant Support**: Isolate actions per tenant
- [ ] **Persistent logging**: Database-backed logging and analytics
- [ ] **Time-travel debugging**: Replay action sequences

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
