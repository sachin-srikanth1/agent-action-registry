import type { Action, ExecutionContext } from './types.js';
import { validateInput } from './validation.js';

export interface EvaluationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ActionEvaluator {
  evaluate(action: Action, input: any, context?: ExecutionContext): EvaluationResult;
}

export class DefaultEvaluator implements ActionEvaluator {
  evaluate(action: Action, input: any, context?: ExecutionContext): EvaluationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      validateInput(action, input);
    } catch (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      }
    }

    if (action.permissions && action.permissions.length > 0) {
      if (!context?.permissions) {
        errors.push(`Action requires permissions but no context provided`);
      } else {
        const missingPermissions = action.permissions.filter(
          p => !context.permissions?.includes(p)
        );

        if (missingPermissions.length > 0) {
          errors.push(`Missing permissions: ${missingPermissions.join(', ')}`);
        }
      }
    }

    if (action.inputs) {
      const providedFields = Object.keys(input);
      const requiredFields = Object.keys(action.inputs).filter(
        k => action.inputs[k].required
      );
      const optionalFields = Object.keys(action.inputs).filter(
        k => !action.inputs[k].required
      );

      const extraFields = providedFields.filter(
        f => !requiredFields.includes(f) && !optionalFields.includes(f)
      );

      if (extraFields.length > 0) {
        warnings.push(`Extra fields provided: ${extraFields.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}

export async function dryRun<TInput = any, TOutput = any>(
  action: Action<TInput, TOutput>,
  input: TInput,
  context?: ExecutionContext
): Promise<EvaluationResult> {
  const evaluator = new DefaultEvaluator();
  return evaluator.evaluate(action, input, context);
}
