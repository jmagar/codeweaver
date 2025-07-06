# CodeWeaver - Complete Technical PRD

**Version:** 1.0  
**Date:** January 2025  
**Status:** Draft

## 1. Executive Summary

This document outlines the complete technical requirements for **CodeWeaver**, a next-generation AI-assisted development application. CodeWeaver is designed to provide a seamless, multi-modal, and agentic coding experience by integrating cutting-edge AI providers, a robust real-time API layer, and a modern, scalable infrastructure.

The architecture is built on a **pnpm monorepo** using **TypeScript project references** for maximum scalability and developer efficiency. The frontend will be a **Next.js 15** application leveraging **React 19** features, styled with **TailwindCSS 4**. The backend is powered by a **tRPC API** for end-to-end type safety, with real-time capabilities handled by **WebSocket subscriptions**.

AI capabilities are managed through a flexible **provider abstraction layer**, allowing integration with **OpenRouter**, **Claude Code**, and **Gemini CLI**. The system will use the **Vercel AI SDK v5 Beta**, which provides a structured, content-first approach to handling complex, multi-modal AI interactions. Further extensibility is achieved through the **Model Context Protocol (MCP)**, enabling the application to interact with external tools and data sources in a standardized way.

The entire application will be containerized using **Docker** with multi-stage builds for optimized deployments. The infrastructure, managed via **Docker Compose**, includes **PostgreSQL** with vector extensions for data and embedding storage, and **Redis** for caching, session management, and rate limiting. Authentication will be handled through **Google OAuth** integrated with NextAuth.js. Comprehensive monitoring and observability will be established using **OpenTelemetry**, **Prometheus**, and **Grafana**.

## 2. Feature Requirements

### 2.1. Core Application
- **FR-01: User Authentication**: Users must be able to sign up and log in using their Google account.
- **FR-02: Monorepo Structure**: The project must be structured as a pnpm monorepo for scalability and maintainability.
- **FR-03: Type-Safe API**: The application must feature an end-to-end type-safe API using tRPC.

### 2.2. AI and Chat
- **FR-04: Multi-Provider AI Integration**: The system must support multiple AI providers, including OpenRouter, Claude, and Gemini.
- **FR-05: Real-time Chat Interface**: A real-time chat interface must be provided for interacting with AI models.
- **FR-06: AI SDK v5 Integration**: The application must utilize the Vercel AI SDK v5 for handling multi-modal and agentic AI responses.
- **FR-07: MCP Tool Integration**: The system must be able to connect to MCP servers to extend its capabilities with external tools.

### 2.3. Infrastructure and Deployment
- **FR-08: Containerized Deployment**: The entire application must be containerized using Docker.
- **FR-09: Multi-Environment Setup**: The infrastructure must support distinct development, staging, and production environments.
- **FR-10: Caching and Performance**: A Redis-based caching layer must be implemented for LLM responses, sessions, and API rate limiting.
- **FR-11: Vector Database**: PostgreSQL with the `pgvector` extension must be used for storing and searching embeddings.
- **FR-12: Monitoring and Observability**: A comprehensive monitoring stack (Prometheus, Grafana, OpenTelemetry) must be in place.

## 3. Technical Architecture

### 3.1. High-Level Architecture Diagram

```mermaid
graph TD
    subgraph "User Interface"
        A[Next.js 15 App] -- tRPC Client --> B{API Gateway}
    end

    subgraph "Backend Services (Monorepo)"
        B -- tRPC Calls --> C[tRPC Router]
        C -- Provider Abstraction --> D{AI Provider Layer}
        C -- Database Ops --> F[PostgreSQL]
        C -- Caching/Jobs --> G[Redis]
    end

    subgraph "AI Providers & Tools"
        D -- API Calls --> E1[OpenRouter]
        D -- API Calls --> E2[Claude API]
        D -- CLI Calls --> E3[Gemini CLI]
        D -- MCP Client --> H[MCP Servers]
    end

    subgraph "Infrastructure"
        F
        G
        I[Docker Environment]
    end
    
    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px
    style D fill:#cfc,stroke:#333,stroke-width:2px
    style F fill:#fcf,stroke:#333,stroke-width:2px
    style G fill:#fcf,stroke:#333,stroke-width:2px
```

### 3.2. Component Breakdown

| Component                 | Technology                       | Description                                                                                             |
| ------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Frontend Application**  | Next.js 15, React 19, Tailwind 4 | The main web interface for users. Consumes the tRPC API.                                                |
| **API Layer**             | tRPC, WebSockets                 | Provides end-to-end type-safe API endpoints for queries, mutations, and real-time subscriptions.        |
| **AI SDK**                | Vercel AI SDK v5 Beta            | Manages interaction with LLMs, handling structured, multi-modal content and streaming.                  |
| **Provider Abstraction**  | Custom TypeScript Layer          | A factory-pattern-based layer to abstract different AI provider APIs (OpenRouter, Claude, Gemini).      |
| **MCP Client**            | `@modelcontextprotocol/sdk`      | Manages connections to external MCP servers for accessing tools and resources.                          |
| **Database**              | PostgreSQL 15, `pgvector`        | Primary data store for user data, application state, and vector embeddings.                             |
| **Cache & Message Broker**| Redis 7                          | Used for session storage, response caching, rate limiting, and as a message broker for real-time events.|
| **Authentication**        | NextAuth.js, Google OAuth        | Handles user authentication and session management.                                                     |
| **Containerization**      | Docker, Docker Compose           | Packages and orchestrates all services for consistent deployment across environments.                   |
| **Monitoring**            | OpenTelemetry, Prometheus, Grafana | Collects, stores, and visualizes metrics, logs, and traces for observability.                           |
| **Monorepo Tooling**      | pnpm, TypeScript, Turbo          | Manages the codebase, dependencies, and build processes.                                                |

## 4. Database Schema

### 4.1. Core Models (Prisma Schema)

```prisma
// datasource db {
//   provider = "postgresql"
//   url      = env("DATABASE_URL")
// }

// generator client {
//   provider = "prisma-client-js"
// }

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  accounts      Account[]
  sessions      Session[]
  conversations Conversation[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model Conversation {
  id        String    @id @default(cuid())
  userId    String
  title     String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  user      User      @relation(fields: [userId], references: [id])
  messages  Message[]
}

model Message {
  id             String       @id @default(cuid())
  conversationId String
  role           String       // "user", "assistant", "system"
  content        Json         // AI SDK v5 UIMessagePart structure
  createdAt      DateTime     @default(now())
  conversation   Conversation @relation(fields: [conversationId], references: [id])
}

model DocumentEmbedding {
  id        Int      @id @default(autoincrement())
  content   String
  embedding Unsupported("vector(1536)") // Using pgvector
  metadata  Json
  createdAt DateTime @default(now())
}
```

## 5. API Specifications (tRPC)

### 5.1. Router Structure

```
- appRouter
  - auth: (login, logout, getSession)
  - user: (getProfile, updateProfile)
  - chat:
    - createConversation: mutation
    - getConversation: query
    - listConversations: query
    - sendMessage: mutation
    - onMessageUpdate: subscription (real-time streaming)
  - provider:
    - listAvailable: query
    - setActive: mutation
  - mcp:
    - listServers: query
    - connectServer: mutation
    - listTools: query
    - callTool: mutation
```

### 5.2. Example Procedure: `chat.sendMessage`

```typescript
// lib/trpc/routers/chat.ts
import { protectedProcedure, createTRPCRouter } from '../init';
import { z } from 'zod';
import { streamText } from 'ai';
import { getProviderForUser } from '@/lib/ai/provider-manager';
import { convertToModelMessages } from 'ai'; // Assuming AI SDK v5 utility

export const chatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.string(),
      messages: z.any(), // Should be strongly typed with UIMessage
    }))
    .mutation(async ({ input, ctx }) => {
      const activeProvider = await getProviderForUser(ctx.session.user.id);

      const result = await streamText({
        model: activeProvider.model, // e.g., openai('gpt-4o')
        messages: convertToModelMessages(input.messages),
        // Additional options like tools, stopWhen, etc.
      });
      
      // The client will handle the UIMessageStreamResponse
      return result.toUIMessageStreamResponse();
    }),
  
  onMessageUpdate: protectedProcedure
    .input(z.object({ conversationId: z.string() }))
    .subscription(({ input, ctx }) => {
      // WebSocket subscription logic here
      // Emits updates for the given conversation
    }),
});
```

## 6. Security and Performance Requirements

### 6.1. Security Requirements
- **SEC-01: Secure Authentication**: All user-specific endpoints must be protected. Passwords and API keys must be encrypted at rest.
- **SEC-02: Input Validation**: All API inputs must be rigorously validated using Zod schemas to prevent injection and other attacks.
- **SEC-03: Rate Limiting**: Implement Redis-based rate limiting on sensitive API endpoints to prevent abuse.
- **SEC-04: Secret Management**: All secrets (API keys, database URLs) must be managed via environment variables and Docker secrets, never committed to source control.
- **SEC-05: Container Security**: Docker images must be built from official, hardened base images, run as non-root users, and regularly scanned for vulnerabilities.

### 6.2. Performance Requirements
- **PERF-01: API Response Time**: P95 latency for standard (non-AI) API requests should be < 200ms.
- **PERF-02: Real-time Latency**: Time-to-first-token for AI chat responses should be < 500ms.
- **PERF-03: Caching**: Implement a multi-layer caching strategy (in-memory, Redis) for frequently accessed data and AI responses to reduce latency and cost.
- **PERF-04: Database Performance**: Database queries must be optimized. Use connection pooling (PgBouncer) to handle high concurrency.
- **PERF-05: Cold Start**: Application startup time should be minimized through optimized Docker images and efficient initialization logic.

## 7. Deployment and Infrastructure

### 7.1. Environments
- **Development**: Local setup using Docker Compose for service consistency. Enables hot-reloading and detailed logging.
- **Staging**: A production-like environment for testing new features and integrations before release.
- **Production**: Scalable and resilient deployment. Infrastructure will be managed via Docker Compose initially, with a clear migration path to Kubernetes if required.

### 7.2. Docker Compose Configuration (`docker-compose.yml`)

```yaml
version: '3.9'

services:
  app:
    build:
      context: .
      dockerfile: ./apps/web/Dockerfile
      target: runner
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
    env_file: .env.production
    secrets:
      - postgres_password
    environment:
      - DATABASE_URL=postgresql://user:$$POSTGRES_PASSWORD@postgres:5432/codeweaver
      - REDIS_URL=redis://redis:6379

  postgres:
    image: pgvector/pgvector:pg15
    restart: always
    environment:
      - POSTGRES_USER=user
      - POSTGRES_DB=codeweaver
    secrets:
      - postgres_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes --maxmemory 2gb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:

secrets:
  postgres_password:
    file: ./secrets/postgres_password.txt
```

### 7.3. CI/CD Pipeline
- **Continuous Integration**: On every push to `main` or pull request, a GitHub Actions workflow will:
    1. Install dependencies (`pnpm install`).
    2. Run linting and type-checking.
    3. Run unit and integration tests.
    4. Build all applications and packages.
    5. Build Docker images.
    6. Run security scans on Docker images (e.g., Trivy).
- **Continuous Deployment**: On a merge to `main`, the workflow will deploy the new Docker images to the production environment.
---
This document serves as the primary technical guide for the development of CodeWeaver. It should be considered a living document and updated as the project evolves. 