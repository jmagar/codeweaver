# API-First Development Guide for CodeWeaver

**Version:** 1.0  
**Date:** July 7, 2025

## 1. Introduction

This guide outlines the API-first development workflow for the CodeWeaver project. We use **tRPC** to achieve end-to-end type safety, which makes our API the central contract between the frontend and backend. By defining the API first, we ensure that both client and server development can proceed in parallel with clear, type-safe expectations.

## 2. The tRPC Workflow

Our development process revolves around defining and evolving the tRPC router in the `packages/api` package.

### Step 1: Define the Schema (Input/Output)
Before writing any implementation logic, define the input and output schemas for your procedure using **Zod**. This is the most critical step as it establishes the data contract.

```typescript
// packages/api/src/routers/user.ts
import { z } from 'zod';

// Input schema for getting a user profile
export const GetUserProfileInput = z.object({
  userId: z.string().uuid(),
});

// Output schema (inferred by Prisma, but good practice for clarity)
export const UserProfileOutput = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string().email(),
  image: z.string().url().nullable(),
});
```

### Step 2: Create the Procedure
Add the new procedure to the appropriate tRPC router, attaching the input schema. The implementation logic comes next.

```typescript
// packages/api/src/routers/user.ts
import { publicProcedure, createTRPCRouter } from '../trpc';
import { GetUserProfileInput } from './schemas'; // Assuming schemas are separated

export const userRouter = createTRPCRouter({
  getProfile: publicProcedure
    .input(GetUserProfileInput)
    .query(async ({ input, ctx }) => {
      // Implementation logic here
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
      });
      return user;
    }),
});
```

### Step 3: Implement the Logic
Write the business logic for the procedure within the `query`, `mutation`, or `subscription` handler. This logic will typically interact with the database (`ctx.db`) or other services.

### Step 4: Consume on the Client
Once the procedure is defined on the backend, it is immediately available and fully typed on the client.

```typescript
// apps/web/src/components/UserProfile.tsx
import { trpc } from '@/lib/trpc/client';

function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = trpc.user.getProfile.useQuery({ userId });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  // `user` is fully typed here, matching the server's return type.
  return (
    <div>
      <h1>{user?.name}</h1>
      <p>{user?.email}</p>
    </div>
  );
}
```

## 3. Creating a New Router

While adding procedures to existing routers is common, you'll often need to create new routers to handle distinct domains of your application (e.g., `project`, `billing`, etc.).

### Step 1: Create the Router File
Create a new file in `packages/api/src/routers/`. For example, `project.ts`.

### Step 2: Define and Export the Router
Inside `project.ts`, define your new router using `createTRPCRouter` and add your procedures.

```typescript
// packages/api/src/routers/project.ts
import { publicProcedure, createTRPCRouter } from '../trpc';
import { z } from 'zod';

export const projectRouter = createTRPCRouter({
  getById: publicProcedure
    .input(z.object({ projectId: z.string() }))
    .query(({ input }) => {
      // Your logic here
      return { id: input.projectId, name: 'My Project' };
    }),
});
```

### Step 3: Merge into the Root Router
The final step is to merge your new router into the main `appRouter`.

Open `packages/api/src/root.ts` and add your new router to the `createTRPCRouter` call.

```typescript
// packages/api/src/root.ts
import { userRouter } from './routers/user';
import { healthRouter } from './routers/health';
import { projectRouter } from './routers/project'; // 1. Import it
import { createTRPCRouter } from './trpc';

export const appRouter = createTRPCRouter({
  user: userRouter,
  health: healthRouter,
  project: projectRouter, // 2. Add it here
});

export type AppRouter = typeof appRouter;
```
Once merged, the new `project` procedures will be available on the client just like any other.

## 4. Endpoint Design Process

- **Identify the Domain**: Determine which router the new endpoint belongs to (e.g., `user`, `chat`, `project`). If a new domain is needed, follow the steps above to create a new router file.
- **Choose the Procedure Type**:
    - `query`: For read-only operations (fetching data).
    - `mutation`: For write operations (creating, updating, deleting data).
    - `subscription`: For real-time, persistent connections (e.g., live chat updates).
- **Define Inputs**: Use Zod to define a clear, strict schema for all data coming into the API. Be as specific as possible (e.g., `z.string().uuid()` instead of just `z.string()`).
- **Define Logic**: Implement the core logic, utilizing the `ctx` object to access the database, session info, etc.
- **Define Outputs**: While tRPC infers output types, ensure your function returns a consistent and predictable shape. For complex objects, you can define an explicit Zod output schema for clarity.

## 5. Schema Patterns for a Chat Application

### User and Session Management
- **`auth.getSession` (Query)**: Fetches the current user's session. No input required.
- **`user.getProfile` (Query)**: Fetches a user's public profile. Input: `{ userId: string }`.

### Conversation Management
- **`chat.listConversations` (Query)**: Fetches a paginated list of the current user's conversations.
- **`chat.createConversation` (Mutation)**: Creates a new chat conversation. Input: `{ title: string, initialMessage: string }`.
- **`chat.deleteConversation` (Mutation)**: Deletes a conversation. Input: `{ conversationId: string }`.

### Message Handling
- **`chat.sendMessage` (Mutation)**: Sends a message to a conversation and streams back the AI's response. This is a key procedure that will interact with the AI Provider layer.
  - **Input**: `{ conversationId: string, messages: UIMessage[] }`. The `messages` array contains the full context for the AI.
  - **Output**: A `UIMessageStreamResponse` from the Vercel AI SDK.
- **`chat.onMessageUpdate` (Subscription)**: Subscribes to real-time updates for a specific conversation.
  - **Input**: `{ conversationId: string }`.
  - **Output**: A stream of message chunks or status updates.

## 6. AI Provider Integration Patterns

- **Centralized Access**: All tRPC procedures that interact with AI models **must** go through the `AIProvider` abstraction layer in `packages/lib/ai`.
- **Context is Key**: The `ctx` object in tRPC is the perfect place to instantiate and provide the `AIProvider` to your procedures.

```typescript
// packages/api/src/context.ts
import { initAIProvider } from '@/packages/lib/ai';

export async function createTRPCContext() {
  const session = await getSession();
  const db = prisma;
  
  // Instantiate the AI provider based on user settings or defaults
  const aiProvider = await initAIProvider(session?.user?.id);

  return {
    session,
    db,
    aiProvider,
  };
}
```

- **Procedure Implementation**:
```typescript
// packages/api/src/routers/chat.ts
export const chatRouter = createTRPCRouter({
  sendMessage: protectedProcedure
    .input(...)
    .mutation(async ({ input, ctx }) => {
      const { aiProvider } = ctx;

      const stream = await aiProvider.stream({
        model: 'claude-3-opus', // Or get from user preferences
        messages: input.messages,
      });

      return stream;
    }),
});
```

## 7. Testing Strategies

- **Unit Testing Routers**: Test individual tRPC routers in isolation. You can mock the `ctx` object to provide a fake database client and session.
- **Integration Testing**: Write tests that call the tRPC server and assert the responses, including database side-effects. Use a separate test database.
- **Client-Side Testing**: Use tools like Vitest and React Testing Library to test components that consume tRPC hooks. You can use a library like `trpc-mock` to mock the tRPC client in your tests.

This API-first approach, powered by tRPC, ensures our development process is robust, type-safe, and highly efficient. 