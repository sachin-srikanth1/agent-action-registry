import type { Action, InputSchema, ValidationError } from './types.js';
import { ActionValidationError } from './types.js';

export function validateInput(action: Action, input: any): void {
  const errors: ValidationError[] = [];

  for (const [fieldName, schema] of Object.entries(action.inputs)) {
    const value = input[fieldName];
    const fieldErrors = validateField(fieldName, value, schema);
    errors.push(...fieldErrors);
  }

  if (errors.length > 0) {
    throw new ActionValidationError(
      `Validation failed for action "${action.id}": ${errors.map(e => e.message).join(', ')}`,
      errors
    );
  }
}

function validateField(
  fieldName: string,
  value: any,
  schema: InputSchema
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (schema.required && (value === undefined || value === null)) {
    errors.push({
      field: fieldName,
      message: `Field "${fieldName}" is required`
    });
    return errors;
  }

  if (value === undefined || value === null) {
    return errors;
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') {
        errors.push({
          field: fieldName,
          message: `Field "${fieldName}" must be a string`
        });
      }
      break;

    case 'number':
      if (typeof value !== 'number' || isNaN(value)) {
        errors.push({
          field: fieldName,
          message: `Field "${fieldName}" must be a number`
        });
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        errors.push({
          field: fieldName,
          message: `Field "${fieldName}" must be a boolean`
        });
      }
      break;

    case 'enum':
      if (!schema.enum || !schema.enum.includes(value)) {
        errors.push({
          field: fieldName,
          message: `Field "${fieldName}" must be one of: ${schema.enum?.join(', ')}`
        });
      }
      break;

    case 'object':
      if (typeof value !== 'object' || Array.isArray(value)) {
        errors.push({
          field: fieldName,
          message: `Field "${fieldName}" must be an object`
        });
      } else if (schema.properties) {
        for (const [propName, propSchema] of Object.entries(schema.properties)) {
          const propValue = value[propName];
          const propErrors = validateField(`${fieldName}.${propName}`, propValue, propSchema);
          errors.push(...propErrors);
        }
      }
      break;
  }

  return errors;
}
