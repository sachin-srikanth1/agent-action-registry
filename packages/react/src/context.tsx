import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { ActionRegistry } from 'agent-action-registry';
import type { Action, ActionResult, ExecutionContext, EvaluationResult, ActionLog, RollbackEntry } from 'agent-action-registry';

interface AgentActionsContextValue {
  actions: Action[];
  registerAction: (action: Action) => void;
  unregisterAction: (id: string) => boolean;
  getAction: (id: string) => Action | undefined;
  executeAction: <TInput = any, TOutput = any>(
    id: string,
    input: TInput,
    context?: ExecutionContext,
    options?: { dryRun?: boolean }
  ) => Promise<ActionResult<TOutput>>;
  evaluate: (actionId: string, input: any, context?: ExecutionContext) => EvaluationResult;
  rollback: (actionId?: string) => Promise<ActionResult>;
  getLogs: (filter?: any) => ActionLog[];
  getHistory: () => RollbackEntry[];
  canRollback: () => boolean;
}

const AgentActionsContext = createContext<AgentActionsContextValue | null>(null);

interface AgentActionsProviderProps {
  children: React.ReactNode;
  registry?: ActionRegistry;
  context?: ExecutionContext;
}

export function AgentActionsProvider({
  children,
  registry: externalRegistry,
  context: defaultContext
}: AgentActionsProviderProps) {
  const [registry] = useState(() => externalRegistry || new ActionRegistry());
  const [actions, setActions] = useState<Action[]>(() => registry.getActions());

  const registerAction = useCallback((action: Action) => {
    registry.registerAction(action);
    setActions(registry.getActions());
  }, [registry]);

  const unregisterAction = useCallback((id: string) => {
    const result = registry.unregisterAction(id);
    setActions(registry.getActions());
    return result;
  }, [registry]);

  const getAction = useCallback((id: string) => {
    return registry.getAction(id);
  }, [registry]);

  const executeAction = useCallback(async <TInput = any, TOutput = any>(
    id: string,
    input: TInput,
    context?: ExecutionContext,
    options?: { dryRun?: boolean }
  ): Promise<ActionResult<TOutput>> => {
    return registry.executeAction<TInput, TOutput>(
      id,
      input,
      context || defaultContext,
      options
    );
  }, [registry, defaultContext]);

  const evaluate = useCallback((actionId: string, input: any, context?: ExecutionContext) => {
    return registry.evaluate(actionId, input, context || defaultContext);
  }, [registry, defaultContext]);

  const rollback = useCallback(async (actionId?: string) => {
    return registry.rollback(actionId);
  }, [registry]);

  const getLogs = useCallback((filter?: any) => {
    return registry.getLogs(filter);
  }, [registry]);

  const getHistory = useCallback(() => {
    return registry.getHistory();
  }, [registry]);

  const canRollback = useCallback(() => {
    return registry.canRollback();
  }, [registry]);

  const value: AgentActionsContextValue = {
    actions,
    registerAction,
    unregisterAction,
    getAction,
    executeAction,
    evaluate,
    rollback,
    getLogs,
    getHistory,
    canRollback
  };

  return (
    <AgentActionsContext.Provider value={value}>
      {children}
    </AgentActionsContext.Provider>
  );
}

export function useAgentActions(): AgentActionsContextValue {
  const context = useContext(AgentActionsContext);

  if (!context) {
    throw new Error('useAgentActions must be used within an AgentActionsProvider');
  }

  return context;
}
