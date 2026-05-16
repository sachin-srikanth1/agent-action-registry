import { describe, it, expect, beforeEach } from 'vitest';
import { ActionRegistry } from './registry.js';
import { ActionNotFoundError, ActionPermissionError, ActionValidationError } from './types.js';
import type { Action } from './types.js';

describe('ActionRegistry', () => {
  let registry: ActionRegistry;

  beforeEach(() => {
    registry = new ActionRegistry();
  });

  describe('registerAction', () => {
    it('should register an action', () => {
      const action: Action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        inputs: {},
        handler: async () => ({ result: 'success' })
      };

      registry.registerAction(action);
      expect(registry.getAction('test-action')).toBe(action);
    });

    it('should throw error when registering duplicate action', () => {
      const action: Action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        inputs: {},
        handler: async () => ({ result: 'success' })
      };

      registry.registerAction(action);
      expect(() => registry.registerAction(action)).toThrow('already registered');
    });
  });

  describe('unregisterAction', () => {
    it('should unregister an action', () => {
      const action: Action = {
        id: 'test-action',
        name: 'Test Action',
        description: 'A test action',
        inputs: {},
        handler: async () => ({ result: 'success' })
      };

      registry.registerAction(action);
      expect(registry.unregisterAction('test-action')).toBe(true);
      expect(registry.getAction('test-action')).toBeUndefined();
    });

    it('should return false for non-existent action', () => {
      expect(registry.unregisterAction('non-existent')).toBe(false);
    });
  });

  describe('getActions', () => {
    it('should return all registered actions', () => {
      const action1: Action = {
        id: 'action-1',
        name: 'Action 1',
        description: 'First action',
        inputs: {},
        handler: async () => ({})
      };

      const action2: Action = {
        id: 'action-2',
        name: 'Action 2',
        description: 'Second action',
        inputs: {},
        handler: async () => ({})
      };

      registry.registerAction(action1);
      registry.registerAction(action2);

      const actions = registry.getActions();
      expect(actions).toHaveLength(2);
      expect(actions).toContain(action1);
      expect(actions).toContain(action2);
    });
  });

  describe('executeAction', () => {
    it('should execute action successfully', async () => {
      const action: Action = {
        id: 'create-task',
        name: 'Create Task',
        description: 'Creates a new task',
        inputs: {
          title: { type: 'string', required: true }
        },
        handler: async (input: any) => ({ taskId: '123', title: input.title })
      };

      registry.registerAction(action);

      const result = await registry.executeAction('create-task', { title: 'Test Task' });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ taskId: '123', title: 'Test Task' });
      expect(result.actionId).toBe('create-task');
    });

    it('should return error for non-existent action', async () => {
      const result = await registry.executeAction('non-existent', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
      expect(result.actionId).toBe('non-existent');
    });

    it('should validate inputs', async () => {
      const action: Action = {
        id: 'create-invoice',
        name: 'Create Invoice',
        description: 'Creates an invoice',
        inputs: {
          amount: { type: 'number', required: true },
          customerId: { type: 'string', required: true }
        },
        handler: async () => ({ invoiceId: '123' })
      };

      registry.registerAction(action);

      const result = await registry.executeAction('create-invoice', { amount: 'invalid' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    it('should check permissions', async () => {
      const action: Action = {
        id: 'delete-user',
        name: 'Delete User',
        description: 'Deletes a user',
        inputs: {
          userId: { type: 'string', required: true }
        },
        permissions: ['admin:write'],
        handler: async () => ({ success: true })
      };

      registry.registerAction(action);

      const resultNoContext = await registry.executeAction('delete-user', { userId: '123' });
      expect(resultNoContext.success).toBe(false);
      expect(resultNoContext.error).toContain('permissions');

      const resultNoPermission = await registry.executeAction(
        'delete-user',
        { userId: '123' },
        { permissions: ['user:read'] }
      );
      expect(resultNoPermission.success).toBe(false);

      const resultWithPermission = await registry.executeAction(
        'delete-user',
        { userId: '123' },
        { permissions: ['admin:write'] }
      );
      expect(resultWithPermission.success).toBe(true);
    });
  });

  describe('input validation', () => {
    it('should validate string type', async () => {
      const action: Action = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        inputs: {
          name: { type: 'string', required: true }
        },
        handler: async () => ({})
      };

      registry.registerAction(action);

      const validResult = await registry.executeAction('test', { name: 'John' });
      expect(validResult.success).toBe(true);

      const invalidResult = await registry.executeAction('test', { name: 123 });
      expect(invalidResult.success).toBe(false);
    });

    it('should validate number type', async () => {
      const action: Action = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        inputs: {
          age: { type: 'number', required: true }
        },
        handler: async () => ({})
      };

      registry.registerAction(action);

      const validResult = await registry.executeAction('test', { age: 25 });
      expect(validResult.success).toBe(true);

      const invalidResult = await registry.executeAction('test', { age: '25' });
      expect(invalidResult.success).toBe(false);
    });

    it('should validate boolean type', async () => {
      const action: Action = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        inputs: {
          active: { type: 'boolean', required: true }
        },
        handler: async () => ({})
      };

      registry.registerAction(action);

      const validResult = await registry.executeAction('test', { active: true });
      expect(validResult.success).toBe(true);

      const invalidResult = await registry.executeAction('test', { active: 'true' });
      expect(invalidResult.success).toBe(false);
    });

    it('should validate enum type', async () => {
      const action: Action = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        inputs: {
          status: { type: 'enum', enum: ['active', 'inactive'], required: true }
        },
        handler: async () => ({})
      };

      registry.registerAction(action);

      const validResult = await registry.executeAction('test', { status: 'active' });
      expect(validResult.success).toBe(true);

      const invalidResult = await registry.executeAction('test', { status: 'pending' });
      expect(invalidResult.success).toBe(false);
    });

    it('should validate object type with nested properties', async () => {
      const action: Action = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        inputs: {
          user: {
            type: 'object',
            required: true,
            properties: {
              name: { type: 'string', required: true },
              age: { type: 'number', required: true }
            }
          }
        },
        handler: async () => ({})
      };

      registry.registerAction(action);

      const validResult = await registry.executeAction('test', {
        user: { name: 'John', age: 25 }
      });
      expect(validResult.success).toBe(true);

      const invalidResult = await registry.executeAction('test', {
        user: { name: 'John', age: '25' }
      });
      expect(invalidResult.success).toBe(false);
    });
  });
});
