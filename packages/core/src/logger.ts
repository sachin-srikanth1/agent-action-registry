import type { Action, ActionResult, ExecutionContext } from './types.js';

export interface ActionLog {
  id: string;
  actionId: string;
  actionName: string;
  timestamp: number;
  userId?: string;
  input: any;
  result: ActionResult;
  duration: number;
  context?: ExecutionContext;
}

export interface Logger {
  log(entry: ActionLog): void;
  getLogs(filter?: LogFilter): ActionLog[];
  clear(): void;
}

export interface LogFilter {
  actionId?: string;
  userId?: string;
  success?: boolean;
  startTime?: number;
  endTime?: number;
}

export class MemoryLogger implements Logger {
  private logs: ActionLog[] = [];
  private maxLogs: number;

  constructor(maxLogs = 1000) {
    this.maxLogs = maxLogs;
  }

  log(entry: ActionLog): void {
    this.logs.push(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(filter?: LogFilter): ActionLog[] {
    if (!filter) {
      return [...this.logs];
    }

    return this.logs.filter(log => {
      if (filter.actionId && log.actionId !== filter.actionId) {
        return false;
      }
      if (filter.userId && log.userId !== filter.userId) {
        return false;
      }
      if (filter.success !== undefined && log.result.success !== filter.success) {
        return false;
      }
      if (filter.startTime && log.timestamp < filter.startTime) {
        return false;
      }
      if (filter.endTime && log.timestamp > filter.endTime) {
        return false;
      }
      return true;
    });
  }

  clear(): void {
    this.logs = [];
  }

  getStats() {
    const total = this.logs.length;
    const successful = this.logs.filter(l => l.result.success).length;
    const failed = total - successful;
    const avgDuration = total > 0
      ? this.logs.reduce((sum, l) => sum + l.duration, 0) / total
      : 0;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      avgDuration
    };
  }
}

export class ConsoleLogger implements Logger {
  private memoryLogger = new MemoryLogger();

  log(entry: ActionLog): void {
    this.memoryLogger.log(entry);

    const status = entry.result.success ? '✓' : '✗';
    const color = entry.result.success ? '\x1b[32m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `${color}${status}${reset} [${new Date(entry.timestamp).toISOString()}] ` +
      `${entry.actionName} (${entry.actionId}) - ${entry.duration}ms` +
      (entry.userId ? ` - User: ${entry.userId}` : '')
    );

    if (!entry.result.success && entry.result.error) {
      console.error(`  Error: ${entry.result.error}`);
    }
  }

  getLogs(filter?: LogFilter): ActionLog[] {
    return this.memoryLogger.getLogs(filter);
  }

  clear(): void {
    this.memoryLogger.clear();
  }
}
