# Vue Vben Admin - Claude Context

## Project Overview

Vue Vben Admin is a modern Vue 3 admin template using TypeScript, Vite, and the latest frontend technologies. This is version 5.x which is a complete rewrite and not compatible with earlier versions.

## Key Technologies

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Pnpm** for package management (minimum version 9.12.0)
- **Turbo** for monorepo management
- **TailwindCSS** for styling
- **Vitest** for unit testing
- **Playwright** for E2E testing

## Project Structure

This is a monorepo with the following structure:

- `apps/web-naive/` - Main Naive UI application
- `apps/backend-mock/` - Mock backend server
- `docs/` - Documentation site
- `packages/` - Shared packages
- `internal/` - Internal tooling

## Available Scripts

- `pnpm dev` - Start development (turbo-run)
- `pnpm dev:naive` - Start Naive UI app
- `pnpm build` - Build all applications
- `pnpm lint` - Run linting
- `pnpm format` - Format code
- `pnpm check` - Run all checks (circular deps, type checking, etc.)
- `pnpm test:unit` - Run unit tests
- `pnpm test:e2e` - Run E2E tests

## Development Commands

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:naive

# Build for production
pnpm build

# Run linting and formatting
pnpm lint
pnpm format

# Run tests
pnpm test:unit
pnpm test:e2e
```

## Code Quality Tools

- **ESLint** with custom configuration (@vben/eslint-config)
- **Prettier** for code formatting (@vben/prettier-config)
- **Stylelint** for CSS linting (@vben/stylelint-config)
- **Commitlint** for conventional commits (@vben/commitlint-config)
- **Lefthook** for git hooks
- **cSpell** for spell checking

## Important Notes

- Node.js version >=20.10.0 required
- Pnpm version >=9.12.0 required
- Uses workspace protocol for internal packages
- Uses Naive UI framework for the main application
- Has built-in internationalization support
- Includes comprehensive permission/access control system
- Features theming and customization options
