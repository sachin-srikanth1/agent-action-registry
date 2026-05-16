import { defaultRegistry } from './registry.js';

export { ActionRegistry, defaultRegistry } from './registry.js';
export type { ActionRegistryConfig } from './registry.js';
export { validateInput } from './validation.js';
export type {
  Action,
  ActionResult,
  ExecutionContext,
  InputSchema,
  InputType,
  ValidationError
} from './types.js';
export {
  ActionValidationError,
  ActionPermissionError,
  ActionNotFoundError
} from './types.js';

export { MemoryLogger, ConsoleLogger } from './logger.js';
export type { Logger, ActionLog, LogFilter } from './logger.js';

export { MemoryRollbackManager } from './rollback.js';
export type { RollbackManager, RollbackEntry, RollbackHandler } from './rollback.js';

export { DefaultEvaluator, dryRun } from './evaluator.js';
export type { ActionEvaluator, EvaluationResult } from './evaluator.js';

export function registerAction(action: any): void {
  defaultRegistry.registerAction(action);
}

export function unregisterAction(id: string): boolean {
  return defaultRegistry.unregisterAction(id);
}

export function getActions(): any[] {
  return defaultRegistry.getActions();
}

export function getAction(id: string): any {
  return defaultRegistry.getAction(id);
}

export async function executeAction<TInput = any, TOutput = any>(
  id: string,
  input: TInput,
  context?: any,
  options?: { dryRun?: boolean }
): Promise<any> {
  return defaultRegistry.executeAction(id, input, context, options);
}

export function evaluate(actionId: string, input: any, context?: any): any {
  return defaultRegistry.evaluate(actionId, input, context);
}

export async function rollback(actionId?: string): Promise<any> {
  return defaultRegistry.rollback(actionId);
}

export function getLogs(filter?: any): any[] {
  return defaultRegistry.getLogs(filter);
}

export function getHistory(): any[] {
  return defaultRegistry.getHistory();
}

export function canRollback(): boolean {
  return defaultRegistry.canRollback();
}
