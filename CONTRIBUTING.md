# Contributing to Hexed

Thank you for your interest in contributing to Hexed!

## Development Setup

1. Fork and clone the repository
2. Install dependencies: `pnpm install`
3. Start dev server: `pnpm dev`
4. Make your changes
5. Test your changes
6. Submit a pull request

## Code Style

- Use TypeScript for all new code
- Follow the existing code style
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep components focused and single-purpose

## Project Structure

```
packages/
├── types/          # Shared TypeScript types
├── binary-utils/   # Core binary processing logic
└── ui/             # Reusable UI components

apps/
└── web/            # Main TanStack Start application
```

## Adding a New Feature

1. Determine which package(s) are affected
2. Update types in `@hexed/types` if needed
3. Implement core logic in appropriate package
4. Add UI components in `@hexed/ui` or `apps/web`
5. Update documentation

## Testing

Currently, tests are not set up. We welcome contributions to:

- Add testing infrastructure (Vitest, Testing Library)
- Write unit tests for binary-utils
- Add integration tests for API routes
- Create E2E tests with Playwright

## Commit Guidelines

Use conventional commits:

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation only
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example:

```
feat(hex-editor): add search functionality
fix(watcher): handle file deletion correctly
docs(readme): update installation instructions
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the CHANGELOG.md (if we add one)
3. The PR will be merged once you have approval from a maintainer

## Areas for Contribution

### High Priority

- Add comprehensive tests
- Performance optimization for large files
- Persistent storage implementation
- Search/find functionality

### Medium Priority

- Byte editing capability
- Multiple file comparison
- Export/import functionality
- Accessibility improvements

### Nice to Have

- Annotations and bookmarks
- Customizable themes
- Plugin system
- WebAssembly acceleration

## Questions?

Feel free to open an issue for:

- Feature requests
- Bug reports
- Questions about the code
- Discussion about architecture

## License

By contributing, you agree that your contributions will be licensed under the ISC License.
