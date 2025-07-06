# Rule: Architecture Patterns

This document outlines the high-level architectural patterns for the CodeWeaver project. These patterns are chosen to ensure scalability, maintainability, and a clear separation of concerns.

## 1. Monorepo with pnpm Workspaces
The entire project is a single monorepo managed by `pnpm`. This facilitates code sharing, centralized dependency management, and streamlined CI/CD.
- **Guideline**: All new features, applications, or libraries must be created as packages or applications within this monorepo. Do not create separate repositories.

## 2. Decoupled API Layer with tRPC
The API logic is decoupled from the web server.
- The tRPC router is defined in the `packages/api` package.
- The Next.js frontend in `apps/web` consumes this router via an API handler (`/api/trpc/[trpc]/route.ts`).
- **Guideline**: All business logic and database interactions must go through the tRPC API layer. Frontend components should not directly access the database. This ensures the API remains the single source of truth and can be potentially consumed by other clients (e.g., a mobile app) in the future.

## 3. Provider Abstraction for External Services
External services, particularly AI providers, are accessed through an abstraction layer.
- The provider logic resides in `packages/lib/ai`.
- This pattern uses a factory or strategy pattern to allow for easy swapping and addition of new providers without changing the core application logic.
- **Guideline**: Never call an external AI provider's SDK or API directly from application code. Always go through the established provider abstraction layer.

## 4. End-to-End Type Safety
Type safety from the database to the frontend is a core principle.
- **Prisma**: Generates types from the database schema.
- **tRPC**: Infers types from the API router and provides them to the client.
- **Zod**: Used for runtime validation of API inputs.
- **Guideline**: Do not use `any` or bypass type checks. Leverage the full power of TypeScript and Zod to ensure data integrity at every layer.

## 5. Environment-Driven Configuration
The application's behavior is configured via environment variables, not hardcoded values.
- **Guideline**: Use the provided `.env.example` as a template. All secrets, API keys, and environment-specific settings must be loaded from environment variables.

## 6. Container-First Approach
All services are designed to be run in Docker containers.
- `docker-compose.yml` orchestrates the development environment.
- Production deployments will use container orchestration (Docker Compose or Kubernetes).
- **Guideline**: When adding a new service (e.g., a new database, a message queue), it must be added to the Docker Compose setup.

## 7. Real-time Communication via WebSockets
For real-time features like live chat updates, WebSockets are used.
- tRPC subscriptions provide the mechanism for real-time data streaming.
- A separate WebSocket server is run to handle these connections.
- **Guideline**: Use tRPC subscriptions for any feature that requires pushing data from the server to the client in real-time. Avoid client-side polling where possible.

Adherence to these architectural patterns is mandatory to ensure the long-term health and scalability of the CodeWeaver platform. 