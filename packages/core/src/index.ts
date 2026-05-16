import { defaultRegistry } from './registry.js';

export { ActionRegistry, defaultRegistry } from './registry.js';
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
  context?: any
): Promise<any> {
  return defaultRegistry.executeAction(id, input, context);
}
