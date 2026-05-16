import type { Action, ActionResult, ExecutionContext } from './types.js';
import { ActionNotFoundError, ActionPermissionError } from './types.js';
import { validateInput } from './validation.js';

export class ActionRegistry {
  private actions: Map<string, Action> = new Map();

  registerAction(action: Action): void {
    if (this.actions.has(action.id)) {
      throw new Error(`Action with id "${action.id}" is already registered`);
    }
    this.actions.set(action.id, action);
  }

  unregisterAction(id: string): boolean {
    return this.actions.delete(id);
  }

  getActions(): Action[] {
    return Array.from(this.actions.values());
  }

  getAction(id: string): Action | undefined {
    return this.actions.get(id);
  }

  validateInput(action: Action, input: any): void {
    validateInput(action, input);
  }

  async executeAction<TInput = any, TOutput = any>(
    id: string,
    input: TInput,
    context?: ExecutionContext
  ): Promise<ActionResult<TOutput>> {
    try {
      const action = this.actions.get(id);

      if (!action) {
        throw new ActionNotFoundError(id);
      }

      if (action.permissions && action.permissions.length > 0) {
        this.checkPermissions(action, context);
      }

      validateInput(action, input);

      const result = await action.handler(input, context);

      return {
        success: true,
        data: result,
        actionId: id
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        actionId: id
      };
    }
  }

  private checkPermissions(action: Action, context?: ExecutionContext): void {
    if (!context?.permissions) {
      throw new ActionPermissionError(
        `Action "${action.id}" requires permissions: ${action.permissions?.join(', ')}`
      );
    }

    const hasAllPermissions = action.permissions?.every(
      permission => context.permissions?.includes(permission)
    );

    if (!hasAllPermissions) {
      throw new ActionPermissionError(
        `Missing required permissions for action "${action.id}": ${action.permissions?.join(', ')}`
      );
    }
  }

  clear(): void {
    this.actions.clear();
  }
}

export const defaultRegistry = new ActionRegistry();
