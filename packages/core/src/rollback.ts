import type { Action, ActionResult, ExecutionContext } from './types.js';

export interface RollbackHandler<TInput = any, TOutput = any> {
  (result: TOutput, input: TInput, context?: ExecutionContext): Promise<void> | void;
}

export interface RollbackEntry {
  id: string;
  actionId: string;
  actionName: string;
  timestamp: number;
  input: any;
  result: any;
  context?: ExecutionContext;
  rollbackHandler?: RollbackHandler;
}

export interface RollbackManager {
  recordExecution(entry: RollbackEntry): void;
  rollback(id?: string): Promise<ActionResult>;
  getHistory(): RollbackEntry[];
  canRollback(): boolean;
  clear(): void;
}

export class MemoryRollbackManager implements RollbackManager {
  private history: RollbackEntry[] = [];
  private maxHistory: number;

  constructor(maxHistory = 100) {
    this.maxHistory = maxHistory;
  }

  recordExecution(entry: RollbackEntry): void {
    this.history.push(entry);

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  async rollback(id?: string): Promise<ActionResult> {
    if (this.history.length === 0) {
      return {
        success: false,
        error: 'No actions to rollback',
        actionId: 'rollback'
      };
    }

    let entry: RollbackEntry | undefined;

    if (id) {
      const index = this.history.findIndex(e => e.id === id);
      if (index === -1) {
        return {
          success: false,
          error: `Action with id ${id} not found in history`,
          actionId: 'rollback'
        };
      }
      entry = this.history.splice(index, 1)[0];
    } else {
      entry = this.history.pop();
    }

    if (!entry) {
      return {
        success: false,
        error: 'No action to rollback',
        actionId: 'rollback'
      };
    }

    if (!entry.rollbackHandler) {
      return {
        success: false,
        error: `Action "${entry.actionName}" does not support rollback`,
        actionId: entry.actionId
      };
    }

    try {
      await entry.rollbackHandler(entry.result, entry.input, entry.context);

      return {
        success: true,
        data: {
          rolledBackAction: entry.actionId,
          rolledBackAt: Date.now()
        },
        actionId: 'rollback'
      };
    } catch (error) {
      this.history.push(entry);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        actionId: 'rollback'
      };
    }
  }

  getHistory(): RollbackEntry[] {
    return [...this.history];
  }

  canRollback(): boolean {
    return this.history.length > 0 && this.history.some(e => e.rollbackHandler !== undefined);
  }

  clear(): void {
    this.history = [];
  }
}
