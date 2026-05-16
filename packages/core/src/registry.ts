import type { Action, ActionResult, ExecutionContext } from './types.js';
import { ActionNotFoundError, ActionPermissionError } from './types.js';
import { validateInput } from './validation.js';
import type { Logger, ActionLog } from './logger.js';
import type { RollbackManager, RollbackEntry } from './rollback.js';
import type { ActionEvaluator, EvaluationResult } from './evaluator.js';
import { DefaultEvaluator } from './evaluator.js';

export interface ActionRegistryConfig {
  logger?: Logger;
  rollbackManager?: RollbackManager;
  evaluator?: ActionEvaluator;
}

export class ActionRegistry {
  private actions: Map<string, Action> = new Map();
  private logger?: Logger;
  private rollbackManager?: RollbackManager;
  private evaluator: ActionEvaluator;

  constructor(config?: ActionRegistryConfig) {
    this.logger = config?.logger;
    this.rollbackManager = config?.rollbackManager;
    this.evaluator = config?.evaluator || new DefaultEvaluator();
  }

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
    context?: ExecutionContext,
    options?: { dryRun?: boolean }
  ): Promise<ActionResult<TOutput>> {
    const startTime = Date.now();
    const logId = `${id}-${startTime}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      const action = this.actions.get(id);

      if (!action) {
        throw new ActionNotFoundError(id);
      }

      if (options?.dryRun) {
        const evaluation = this.evaluator.evaluate(action, input, context);
        return {
          success: evaluation.valid,
          data: { evaluation, dryRun: true } as any,
          error: evaluation.errors.join('; ') || undefined,
          actionId: id
        };
      }

      if (action.permissions && action.permissions.length > 0) {
        this.checkPermissions(action, context);
      }

      validateInput(action, input);

      const result = await action.handler(input, context);

      const actionResult: ActionResult<TOutput> = {
        success: true,
        data: result,
        actionId: id
      };

      const duration = Date.now() - startTime;

      if (this.logger) {
        const logEntry: ActionLog = {
          id: logId,
          actionId: id,
          actionName: action.name,
          timestamp: startTime,
          userId: context?.userId,
          input,
          result: actionResult,
          duration,
          context
        };
        this.logger.log(logEntry);
      }

      if (this.rollbackManager && action.rollbackHandler) {
        const rollbackEntry: RollbackEntry = {
          id: logId,
          actionId: id,
          actionName: action.name,
          timestamp: startTime,
          input,
          result,
          context,
          rollbackHandler: action.rollbackHandler
        };
        this.rollbackManager.recordExecution(rollbackEntry);
      }

      return actionResult;
    } catch (error) {
      const actionResult: ActionResult<TOutput> = {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        actionId: id
      };

      const duration = Date.now() - startTime;

      if (this.logger) {
        const logEntry: ActionLog = {
          id: logId,
          actionId: id,
          actionName: this.actions.get(id)?.name || id,
          timestamp: startTime,
          userId: context?.userId,
          input,
          result: actionResult,
          duration,
          context
        };
        this.logger.log(logEntry);
      }

      return actionResult;
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

  evaluate(actionId: string, input: any, context?: ExecutionContext): EvaluationResult {
    const action = this.actions.get(actionId);
    if (!action) {
      return {
        valid: false,
        errors: [`Action "${actionId}" not found`],
        warnings: []
      };
    }
    return this.evaluator.evaluate(action, input, context);
  }

  async rollback(actionId?: string): Promise<ActionResult> {
    if (!this.rollbackManager) {
      return {
        success: false,
        error: 'Rollback manager not configured',
        actionId: 'rollback'
      };
    }
    return this.rollbackManager.rollback(actionId);
  }

  getLogs(filter?: any): any[] {
    if (!this.logger || !('getLogs' in this.logger)) {
      return [];
    }
    return (this.logger as any).getLogs(filter);
  }

  getHistory(): any[] {
    if (!this.rollbackManager) {
      return [];
    }
    return this.rollbackManager.getHistory();
  }

  canRollback(): boolean {
    if (!this.rollbackManager) {
      return false;
    }
    return this.rollbackManager.canRollback();
  }

  clear(): void {
    this.actions.clear();
  }
}

export const defaultRegistry = new ActionRegistry();
