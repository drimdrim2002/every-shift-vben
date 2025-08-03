# Vue Vben Admin - Claude Context

## Key Technologies

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Pnpm** for package management (minimum version 9.12.0)
- **Turbo** for monorepo management
- **TailwindCSS Version3** for styling
- **Vitest** for unit testing
- **Playwright** for E2E testing

## Project Structure

This is a monorepo with multiple applications:

- `apps/web-naive/` - Naive UI implementation
- `apps/backend-mock/` - Mock backend server
- `playground/` - Development playground
- `docs/` - Documentation site
- `packages/` - Shared packages
- `internal/` - Internal tooling

## Available Scripts

- `pnpm dev` - Start development (turbo-run)
- `pnpm dev:antd` - Start Ant Design app
- `pnpm dev:ele` - Start Element Plus app
- `pnpm dev:naive` - Start Naive UI app
- `pnpm dev:play` - Start playground
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
pnpm dev:play  # or pnpm dev:antd, pnpm dev:ele, pnpm dev:naive

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

## ESLint & Code Style Rules

### General Rules

- **ESLint + Prettier** compliance is mandatory
- Use **perfectionist/sort-imports** and **perfectionist/sort-exports** for consistent ordering
- Remove unused imports with **unused-imports/no-unused-imports**
- Unused variables must be prefixed with underscore `_` if intentionally unused
- Korean comments and variable names are allowed, but function names should be in English

### TypeScript Rules

- Prefer **interfaces** over types for object definitions
- Use **type** for unions, intersections, and mapped types
- Avoid using `any`, prefer `unknown` for unknown types
- Use **strict TypeScript configuration**
- Use **PascalCase** for type names and interfaces
- Use **camelCase** for variables and functions
- Use **UPPER_CASE** for constants
- Prefix interfaces for component props with 'Props' (e.g., ButtonProps)

### Vue.js Rules

- Use **Composition API** over Options API
- Keep components **small and focused**
- Use proper **TypeScript integration**
- Implement proper **props validation** and **emit declarations**
- Keep **template logic minimal**
- Use **v-model** properly and implement proper validation
- Use **Pinia** for state management

### Component Architecture

- Components must be **self-contained and reusable**
- Use **semantic HTML** and proper **ARIA** attributes for accessibility
- All components must have **explicit TypeScript interfaces** for props
- All interactive components must be **keyboard accessible**
- Use **CSS custom properties** for theming (no hardcoded colors)
- Handle **loading and error states** properly

### Import/Export Ordering

- Sort imports/exports alphabetically within groups
- Group order: external packages → internal packages → relative imports
- Types should be imported separately when possible

### Regex and Validation

- Use `\w` instead of `[a-zA-Z0-9_]` character classes
- Use case-insensitive flag `i` when appropriate
- Proper form validation with descriptive error messages

## Important Notes

- Node.js version >=20.10.0 required
- Pnpm version >=9.12.0 required
- Uses workspace protocol for internal packages
- **Supabase integration** for authentication and database
- **Naive UI** as the primary UI framework
- Has built-in internationalization support
- Includes comprehensive permission/access control system
- Features theming and customization options
- **Korean comments and variables are allowed**, but keep function names in English
