# Contributing to Agent Action Registry

Thank you for your interest in contributing! This project is experimental and we welcome all contributions.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/your-username/agent-action-registry.git
   cd agent-action-registry
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build all packages:
   ```bash
   npm run build
   ```
5. Run tests:
   ```bash
   npm test
   ```

## Project Structure

```
agent-action-registry/
├── packages/
│   ├── core/          # Core TypeScript package
│   └── react/         # React integration
├── demo/              # Demo application
└── README.md
```

## Development Workflow

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Run tests to ensure everything works:
   ```bash
   npm test
   ```

4. Build to check for TypeScript errors:
   ```bash
   npm run build
   ```

5. Test the demo app:
   ```bash
   npm run dev
   ```

6. Commit your changes:
   ```bash
   git commit -m "Description of your changes"
   ```

7. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

8. Open a Pull Request

## Guidelines

### Code Style

- Use TypeScript for type safety
- Follow existing code patterns
- Keep functions small and focused
- Add comments only where the code isn't self-explanatory

### Testing

- Add tests for new features
- Ensure all tests pass before submitting PR
- Test coverage should not decrease

### Documentation

- Update README.md if you add new features
- Add JSDoc comments for public APIs
- Include examples for new functionality

## Types of Contributions

### Bug Reports

- Use GitHub Issues
- Include reproduction steps
- Describe expected vs actual behavior
- Include environment details

### Feature Requests

- Use GitHub Issues
- Describe the use case
- Explain why it would be valuable
- Consider proposing an implementation approach

### Code Contributions

We welcome:
- Bug fixes
- New features
- Performance improvements
- Documentation improvements
- Test additions
- Example applications

## Questions?

Feel free to open an issue for any questions about contributing!
