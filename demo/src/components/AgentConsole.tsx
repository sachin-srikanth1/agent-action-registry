import { useState } from 'react';
import { useAgentActions } from '@agent-action-registry/react';
import type { Action, ActionResult } from '@agent-action-registry/react';
import './AgentConsole.css';

function AgentConsole() {
  const { actions, executeAction } = useAgentActions();
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [inputs, setInputs] = useState<Record<string, any>>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);

  const handleActionSelect = (action: Action) => {
    setSelectedAction(action);
    setInputs({});
    setResult(null);
  };

  const handleInputChange = (fieldName: string, value: any, type: string) => {
    let parsedValue = value;

    if (type === 'number') {
      parsedValue = value === '' ? '' : Number(value);
    } else if (type === 'boolean') {
      parsedValue = value === 'true';
    }

    setInputs(prev => ({
      ...prev,
      [fieldName]: parsedValue
    }));
  };

  const handleExecute = async () => {
    if (!selectedAction) return;

    setIsExecuting(true);
    setResult(null);

    try {
      const actionResult = await executeAction(selectedAction.id, inputs);
      setResult(actionResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : String(error),
        actionId: selectedAction.id
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="agent-console">
      <div className="console-header">
        <h2>Agent Console</h2>
        <p className="console-subtitle">
          Select an action and execute it
        </p>
      </div>

      <div className="actions-list">
        <h3>Available Actions</h3>
        <div className="actions-grid">
          {actions.map(action => (
            <button
              key={action.id}
              className={`action-button ${selectedAction?.id === action.id ? 'active' : ''}`}
              onClick={() => handleActionSelect(action)}
            >
              <div className="action-name">{action.name}</div>
              <div className="action-description">{action.description}</div>
              {action.permissions && action.permissions.length > 0 && (
                <div className="action-permissions">
                  {action.permissions.map(p => (
                    <span key={p} className="permission-badge">{p}</span>
                  ))}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {selectedAction && (
        <div className="action-form">
          <h3>Execute: {selectedAction.name}</h3>

          {Object.keys(selectedAction.inputs).length > 0 ? (
            <div className="form-fields">
              {Object.entries(selectedAction.inputs).map(([fieldName, schema]) => (
                <div key={fieldName} className="form-field">
                  <label>
                    {fieldName}
                    {schema.required && <span className="required">*</span>}
                  </label>
                  {schema.description && (
                    <p className="field-description">{schema.description}</p>
                  )}

                  {schema.type === 'enum' ? (
                    <select
                      value={inputs[fieldName] || ''}
                      onChange={(e) => handleInputChange(fieldName, e.target.value, schema.type)}
                    >
                      <option value="">Select...</option>
                      {schema.enum?.map(option => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : schema.type === 'boolean' ? (
                    <select
                      value={inputs[fieldName] !== undefined ? String(inputs[fieldName]) : ''}
                      onChange={(e) => handleInputChange(fieldName, e.target.value, schema.type)}
                    >
                      <option value="">Select...</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  ) : (
                    <input
                      type={schema.type === 'number' ? 'number' : 'text'}
                      value={inputs[fieldName] || ''}
                      onChange={(e) => handleInputChange(fieldName, e.target.value, schema.type)}
                      placeholder={`Enter ${fieldName}`}
                    />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-inputs">This action requires no inputs.</p>
          )}

          <button
            className="execute-button"
            onClick={handleExecute}
            disabled={isExecuting}
          >
            {isExecuting ? 'Executing...' : 'Execute Action'}
          </button>
        </div>
      )}

      {result && (
        <div className={`result ${result.success ? 'success' : 'error'}`}>
          <div className="result-header">
            <span className={`result-status ${result.success ? 'success' : 'error'}`}>
              {result.success ? '✓ Success' : '✗ Error'}
            </span>
            <span className="result-action">{result.actionId}</span>
          </div>

          {result.error && (
            <div className="result-error">{result.error}</div>
          )}

          {result.data && (
            <pre className="result-data">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default AgentConsole;
