# Rule: Naming Conventions

This rule establishes the naming conventions for files, variables, components, and other assets within the CodeWeaver project. Consistency in naming is crucial for readability and maintainability.

## General Principles
- **Clarity over Brevity**: Names should be descriptive and unambiguous.
- **Consistency**: Follow the established pattern for a given type of asset.
- **`camelCase` for variables and functions**: `const userProfile = ...`, `function getUserProfile() {}`.
- **`PascalCase` for classes and types**: `class UserSession {}`, `type UserProfile = ...`.

## File Naming
- **React Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`, `ChatWindow.tsx`).
- **Hooks**: `useCamelCase.ts` (e.g., `useUserSession.ts`).
- **API Routes (Next.js)**: `kebab-case` for segments, `route.ts` for the file (e.g., `app/api/user-profile/route.ts`).
- **Library/Utility Files**: `kebab-case.ts` (e.g., `date-utils.ts`, `api-client.ts`).
- **Configuration Files**: `kebab-case.config.ts` or `kebab-case.config.js` (e.g., `next.config.js`, `tailwind.config.ts`).
- **Test Files**: `*.test.ts` or `*.spec.ts` (e.g., `date-utils.test.ts`).

## Directory Naming
- All directories should be `kebab-case`.
  - **Correct**: `user-profile`, `api-client`
  - **Incorrect**: `userProfile`, `ApiClient`

## Packages (in `packages/`)
- Package names in `package.json` should be scoped: `@codeweaver/package-name`.
- Directory names should be `kebab-case` and match the package name suffix (e.g., directory `api` for package `@codeweaver/api`).

## tRPC Procedures
- **Routers**: `camelCaseRouter` (e.g., `userRouter`, `chatRouter`).
- **Procedures**: `camelCase` (e.g., `userRouter.getProfile`, `chatRouter.sendMessage`).

## Database (Prisma Schema)
- **Models**: `PascalCase`, singular (e.g., `User`, `Post`, `Conversation`).
- **Fields**: `camelCase` (e.g., `createdAt`, `userId`).
- **Enums**: `PascalCase` (e.g., `Role`, `Status`).

## CSS / TailwindCSS
- **Custom Classes**: Follow BEM-like principles if necessary, but prefer utility-first composition.
- **CSS Variables**: `kebab-case` prefixed with `--` (e.g., `--primary-color`).

## Environment Variables
- **Format**: `SCREAMING_SNAKE_CASE` (e.g., `DATABASE_URL`, `NEXTAUTH_SECRET`).

By adhering to these conventions, we ensure the codebase remains clean, predictable, and easy for any developer (or AI assistant) to navigate. 