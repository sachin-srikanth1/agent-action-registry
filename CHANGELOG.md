# Changelog

All notable changes to Agent Action Registry will be documented in this file.

## [0.2.0] - 2024-05-16

### Added
- **Action Logging**: Comprehensive execution logging
  - `MemoryLogger`: In-memory log storage with filtering and stats
  - `ConsoleLogger`: Console output with memory backup
  - Log filtering by actionId, userId, success status, time range
  - Performance metrics and statistics

- **Rollback/Undo**: Reversible actions
  - `rollbackHandler` support in action definitions
  - `MemoryRollbackManager`: Track and undo action history
  - `rollback()`: Undo last action or specific action by ID
  - `getHistory()`: View rollback history
  - `canRollback()`: Check if undo is available

- **Dry-Run Evaluation**: Validate before execution
  - `evaluate()`: Check action validity without execution
  - `executeAction(..., { dryRun: true })`: Dry-run mode
  - Input validation checking
  - Permission requirement checking
  - Extra field warnings

- **React Integration**: All new features exposed through hooks
  - `useAgentActions()` now includes: evaluate, rollback, getLogs, getHistory, canRollback

- **Tests**: 9 new tests for logging, rollback, and evaluation features
  - Total: 23 passing tests

### Changed
- `ActionRegistry` constructor now accepts optional config object:
  - `logger?: Logger`
  - `rollbackManager?: RollbackManager`
  - `evaluator?: ActionEvaluator`

- `executeAction()` now accepts 4th parameter for options:
  - `{ dryRun?: boolean }`

- `Action` interface now includes optional `rollbackHandler`

### Documentation
- Comprehensive README updates with examples
- New "Advanced Features" section
- Updated API Reference
- Updated Roadmap to show completed features

## [0.1.0] - 2024-05-16

### Added
- Initial release
- Core TypeScript action registry
- Input validation (string, number, boolean, enum, object)
- Permission-based access control
- Structured execution results
- React integration with Context and hooks
- Demo SaaS dashboard application
- 14 passing tests
- MIT License
