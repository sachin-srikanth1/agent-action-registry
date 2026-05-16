import { describe, it, expect, beforeEach } from 'vitest';
import { ActionRegistry } from './registry.js';
import { MemoryLogger, ConsoleLogger } from './logger.js';
import { MemoryRollbackManager } from './rollback.js';
import type { Action } from './types.js';

describe('Logging Features', () => {
  it('should log action executions', async () => {
    const logger = new MemoryLogger();
    const registry = new ActionRegistry({ logger });

    const action: Action = {
      id: 'test-action',
      name: 'Test Action',
      description: 'A test',
      inputs: {},
      handler: async () => ({ result: 'success' })
    };

    registry.registerAction(action);
    await registry.executeAction('test-action', {});

    const logs = registry.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].actionId).toBe('test-action');
    expect(logs[0].result.success).toBe(true);
  });

  it('should log errors', async () => {
    const logger = new MemoryLogger();
    const registry = new ActionRegistry({ logger });

    const action: Action = {
      id: 'failing-action',
      name: 'Failing Action',
      description: 'An action that fails',
      inputs: {},
      handler: async () => {
        throw new Error('Test error');
      }
    };

    registry.registerAction(action);
    await registry.executeAction('failing-action', {});

    const logs = registry.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].result.success).toBe(false);
    expect(logs[0].result.error).toContain('Test error');
  });

  it('should filter logs', async () => {
    const logger = new MemoryLogger();
    const registry = new ActionRegistry({ logger });

    const action1: Action = {
      id: 'action-1',
      name: 'Action 1',
      description: 'First',
      inputs: {},
      handler: async () => ({})
    };

    const action2: Action = {
      id: 'action-2',
      name: 'Action 2',
      description: 'Second',
      inputs: {},
      handler: async () => ({})
    };

    registry.registerAction(action1);
    registry.registerAction(action2);

    await registry.executeAction('action-1', {});
    await registry.executeAction('action-2', {});
    await registry.executeAction('action-1', {});

    const allLogs = registry.getLogs();
    expect(allLogs).toHaveLength(3);

    const action1Logs = registry.getLogs({ actionId: 'action-1' });
    expect(action1Logs).toHaveLength(2);
  });
});

describe('Rollback Features', () => {
  it('should record and rollback actions', async () => {
    const rollbackManager = new MemoryRollbackManager();
    const registry = new ActionRegistry({ rollbackManager });

    let counter = 0;

    const action: Action = {
      id: 'increment',
      name: 'Increment',
      description: 'Increments counter',
      inputs: {},
      handler: async () => {
        counter++;
        return { newValue: counter };
      },
      rollbackHandler: async () => {
        counter--;
      }
    };

    registry.registerAction(action);

    await registry.executeAction('increment', {});
    expect(counter).toBe(1);

    await registry.executeAction('increment', {});
    expect(counter).toBe(2);

    expect(registry.canRollback()).toBe(true);

    await registry.rollback();
    expect(counter).toBe(1);

    await registry.rollback();
    expect(counter).toBe(0);
  });

  it('should handle rollback errors', async () => {
    const rollbackManager = new MemoryRollbackManager();
    const registry = new ActionRegistry({ rollbackManager });

    const action: Action = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      inputs: {},
      handler: async () => ({}),
      rollbackHandler: async () => {
        throw new Error('Rollback failed');
      }
    };

    registry.registerAction(action);
    await registry.executeAction('test', {});

    const result = await registry.rollback();
    expect(result.success).toBe(false);
    expect(result.error).toContain('Rollback failed');
  });

  it('should get rollback history', async () => {
    const rollbackManager = new MemoryRollbackManager();
    const registry = new ActionRegistry({ rollbackManager });

    const action: Action = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      inputs: {},
      handler: async () => ({}),
      rollbackHandler: async () => {}
    };

    registry.registerAction(action);
    await registry.executeAction('test', {});
    await registry.executeAction('test', {});

    const history = registry.getHistory();
    expect(history).toHaveLength(2);
  });
});

describe('Evaluation Features', () => {
  it('should evaluate action before execution', () => {
    const registry = new ActionRegistry();

    const action: Action = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      inputs: {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      },
      handler: async () => ({})
    };

    registry.registerAction(action);

    const validEval = registry.evaluate('test', { name: 'John', age: 25 });
    expect(validEval.valid).toBe(true);
    expect(validEval.errors).toHaveLength(0);

    const invalidEval = registry.evaluate('test', { name: 'John' });
    expect(invalidEval.valid).toBe(false);
    expect(invalidEval.errors.length).toBeGreaterThan(0);
  });

  it('should support dry run mode', async () => {
    const registry = new ActionRegistry();
    let executed = false;

    const action: Action = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      inputs: {
        value: { type: 'number', required: true }
      },
      handler: async () => {
        executed = true;
        return {};
      }
    };

    registry.registerAction(action);

    const result = await registry.executeAction('test', { value: 42 }, undefined, { dryRun: true });

    expect(executed).toBe(false);
    expect(result.data).toHaveProperty('dryRun', true);
    expect(result.data).toHaveProperty('evaluation');
  });

  it('should check permissions in evaluation', () => {
    const registry = new ActionRegistry();

    const action: Action = {
      id: 'test',
      name: 'Test',
      description: 'Test',
      inputs: {},
      permissions: ['admin:write'],
      handler: async () => ({})
    };

    registry.registerAction(action);

    const noContextEval = registry.evaluate('test', {});
    expect(noContextEval.valid).toBe(false);
    expect(noContextEval.errors.some(e => e.includes('permissions'))).toBe(true);

    const noPermEval = registry.evaluate('test', {}, { permissions: ['user:read'] });
    expect(noPermEval.valid).toBe(false);

    const validEval = registry.evaluate('test', {}, { permissions: ['admin:write'] });
    expect(validEval.valid).toBe(true);
  });
});
