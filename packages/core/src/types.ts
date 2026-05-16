export type InputType = 'string' | 'number' | 'boolean' | 'enum' | 'object';

export interface InputSchema {
  type: InputType;
  required?: boolean;
  description?: string;
  enum?: string[];
  properties?: Record<string, InputSchema>;
}

export interface Action<TInput = any, TOutput = any> {
  id: string;
  name: string;
  description: string;
  inputs: Record<string, InputSchema>;
  permissions?: string[];
  handler: (input: TInput, context?: ExecutionContext) => Promise<TOutput> | TOutput;
  rollbackHandler?: (result: TOutput, input: TInput, context?: ExecutionContext) => Promise<void> | void;
}

export interface ExecutionContext {
  userId?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
}

export interface ActionResult<TData = any> {
  success: boolean;
  data?: TData;
  error?: string;
  actionId: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export class ActionValidationError extends Error {
  constructor(
    message: string,
    public errors: ValidationError[]
  ) {
    super(message);
    this.name = 'ActionValidationError';
  }
}

export class ActionPermissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ActionPermissionError';
  }
}

export class ActionNotFoundError extends Error {
  constructor(actionId: string) {
    super(`Action not found: ${actionId}`);
    this.name = 'ActionNotFoundError';
  }
}
