# tRPC Modern Architecture - Comprehensive Research

## Executive Summary

This research document covers the latest tRPC patterns and best practices for building modern full-stack applications in 2025. tRPC (TypeScript Remote Procedure Call) provides end-to-end type safety without schemas, making it ideal for TypeScript applications. This analysis covers real-time subscriptions, WebSocket integration, batch optimization, Next.js 15 integration, and monorepo patterns.

## Table of Contents

1. [tRPC Architecture Overview](#trpc-architecture-overview)
2. [Next.js 15 App Router Integration](#nextjs-15-app-router-integration)
3. [Real-time Subscriptions](#real-time-subscriptions)
4. [WebSocket Integration](#websocket-integration)
5. [Batch Query Optimization](#batch-query-optimization)
6. [Monorepo Patterns](#monorepo-patterns)
7. [Performance Optimization](#performance-optimization)
8. [Error Handling and Middleware](#error-handling-and-middleware)
9. [Production Considerations](#production-considerations)
10. [Best Practices](#best-practices)

## tRPC Architecture Overview

### Core Concepts

tRPC operates on three fundamental concepts:

```typescript
// Router - Groups related procedures
const appRouter = router({
  user: userRouter,
  post: postRouter,
  comment: commentRouter,
});

// Procedures - Individual API endpoints
const userRouter = router({
  // Query - Read operations
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      return await db.user.findUnique({ where: { id: input.userId } });
    }),
  
  // Mutation - Write operations
  updateProfile: publicProcedure
    .input(z.object({ name: z.string(), email: z.string().email() }))
    .mutation(async ({ input, ctx }) => {
      return await db.user.update({
        where: { id: ctx.session.userId },
        data: input,
      });
    }),
  
  // Subscription - Real-time data streams
  onProfileUpdate: publicProcedure
    .subscription(() => {
      return observable<User>((emit) => {
        // Implementation for real-time updates
      });
    }),
});
```

### Type Safety Benefits

```typescript
// Server-side type safety
export type AppRouter = typeof appRouter;

// Client-side automatic type inference
const user = await trpc.user.getProfile.query({ userId: "123" });
// TypeScript knows user is User | null without manual typing
```

## Next.js 15 App Router Integration

### Modern Setup Architecture

```typescript
// lib/trpc/init.ts - tRPC initialization for Next.js 15
import { initTRPC, TRPCError } from '@trpc/server';
import { cache } from 'react';
import superjson from 'superjson';
import { ZodError } from 'zod';

// Context creation with React cache for optimization
export const createTRPCContext = cache(async () => {
  return {
    session: await getServerSession(),
    db: prisma,
    headers: headers(),
  };
});

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});
```

### App Router API Handler

```typescript
// app/api/trpc/[trpc]/route.ts - Next.js 15 App Router handler
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { createTRPCContext } from '@/lib/trpc/init';
import { appRouter } from '@/lib/trpc/routers/_app';

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(`❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`);
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

### Server Component Integration

```typescript
// lib/trpc/server.ts - Server-side tRPC client
import 'server-only';
import { createHydrationHelpers } from '@trpc/react-query/rsc';
import { cache } from 'react';
import { createCallerFactory, createTRPCContext } from './init';
import { makeQueryClient } from './query-client';
import { appRouter } from './routers/_app';

export const getQueryClient = cache(makeQueryClient);

const caller = createCallerFactory(appRouter)(createTRPCContext);

const { trpc: serverTrpc, HydrateClient } = createHydrationHelpers<typeof appRouter>(
  caller,
  getQueryClient
);

export { serverTrpc as trpc, HydrateClient };
```

### Client Provider Setup

```typescript
// lib/trpc/react.tsx - Client-side provider
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { useState } from 'react';
import superjson from 'superjson';
import type { AppRouter } from './routers/_app';

export const trpc = createTRPCReact<AppRouter>();

function getBaseUrl() {
  if (typeof window !== 'undefined') return window.location.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            cacheTime: 10 * 60 * 1000, // 10 minutes
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            return {
              'x-trpc-source': 'react',
            };
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## Real-time Subscriptions

### WebSocket-based Subscriptions

```typescript
// lib/trpc/subscription.ts - Real-time subscription implementation
import { observable } from '@trpc/server/observable';
import { EventEmitter } from 'events';
import { z } from 'zod';
import { publicProcedure, createTRPCRouter } from './init';

// Event emitter for real-time updates
const ee = new EventEmitter();

export const subscriptionRouter = createTRPCRouter({
  // Chat room subscription
  onChatMessage: publicProcedure
    .input(z.object({ roomId: z.string() }))
    .subscription(({ input }) => {
      return observable<{ id: string; message: string; userId: string; timestamp: Date }>((emit) => {
        const onMessage = (data: any) => {
          if (data.roomId === input.roomId) {
            emit.next(data);
          }
        };

        ee.on('chatMessage', onMessage);

        return () => {
          ee.off('chatMessage', onMessage);
        };
      });
    }),

  // User status updates
  onUserStatusChange: publicProcedure
    .subscription(() => {
      return observable<{ userId: string; status: 'online' | 'offline' | 'away' }>((emit) => {
        const onStatusChange = (data: any) => {
          emit.next(data);
        };

        ee.on('userStatusChange', onStatusChange);

        return () => {
          ee.off('userStatusChange', onStatusChange);
        };
      });
    }),

  // Real-time notifications
  onNotification: publicProcedure
    .input(z.object({ userId: z.string() }))
    .subscription(({ input, ctx }) => {
      return observable<{ id: string; type: string; message: string; read: boolean }>((emit) => {
        const onNotification = (data: any) => {
          if (data.userId === input.userId) {
            emit.next(data);
          }
        };

        ee.on('notification', onNotification);

        return () => {
          ee.off('notification', onNotification);
        };
      });
    }),
});

// Helper functions to emit events
export const emitChatMessage = (data: { roomId: string; id: string; message: string; userId: string }) => {
  ee.emit('chatMessage', { ...data, timestamp: new Date() });
};

export const emitUserStatusChange = (data: { userId: string; status: 'online' | 'offline' | 'away' }) => {
  ee.emit('userStatusChange', data);
};

export const emitNotification = (data: { userId: string; id: string; type: string; message: string }) => {
  ee.emit('notification', { ...data, read: false });
};
```

### Client-side Subscription Usage

```typescript
// components/ChatRoom.tsx - Using subscriptions in React
'use client';

import { useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc/react';

export function ChatRoom({ roomId }: { roomId: string }) {
  const [messages, setMessages] = useState<any[]>([]);

  // Subscribe to real-time messages
  trpc.subscription.onChatMessage.useSubscription(
    { roomId },
    {
      onData(message) {
        setMessages((prev) => [...prev, message]);
      },
      onError(err) {
        console.error('Subscription error:', err);
      },
    }
  );

  // Send message mutation
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      // Message will appear via subscription
    },
  });

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto p-4">
        {messages.map((message) => (
          <div key={message.id} className="mb-2">
            <span className="font-semibold">{message.userId}: </span>
            <span>{message.message}</span>
            <span className="text-xs text-gray-500 ml-2">
              {message.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
      
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const message = formData.get('message') as string;
          sendMessage.mutate({ roomId, message });
          e.currentTarget.reset();
        }}
        className="p-4 border-t"
      >
        <input
          name="message"
          placeholder="Type a message..."
          className="w-full p-2 border rounded"
          disabled={sendMessage.isLoading}
        />
      </form>
    </div>
  );
}
```

## WebSocket Integration

### WebSocket Adapter Setup

```typescript
// lib/trpc/websocket.ts - WebSocket adapter configuration
import { applyWSSHandler } from '@trpc/server/adapters/ws';
import { WebSocketServer } from 'ws';
import { appRouter } from './routers/_app';
import { createTRPCContext } from './init';

export function createWebSocketServer(port: number = 3001) {
  const wss = new WebSocketServer({ port });

  const handler = applyWSSHandler({
    wss,
    router: appRouter,
    createContext: createTRPCContext,
    onError: ({ error }) => {
      console.error('WebSocket error:', error);
    },
  });

  wss.on('connection', (ws) => {
    console.log(`WebSocket connection established (${wss.clients.size})`);
    
    ws.once('close', () => {
      console.log(`WebSocket connection closed (${wss.clients.size})`);
    });
  });

  console.log(`✅ WebSocket server listening on port ${port}`);

  return {
    wss,
    handler,
    close: () => {
      return new Promise<void>((resolve) => {
        wss.close(resolve);
      });
    },
  };
}
```

### Client WebSocket Configuration

```typescript
// lib/trpc/websocket-client.ts - Client-side WebSocket setup
import { createWSClient, wsLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import { splitLink } from '@trpc/client';
import { httpBatchLink } from '@trpc/client';
import type { AppRouter } from './routers/_app';

// Create WebSocket client
function getWsUrl() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = process.env.NODE_ENV === 'development' 
    ? 'localhost:3001' 
    : window.location.host;
  return `${wsProtocol}//${wsHost}`;
}

const wsClient = createWSClient({
  url: getWsUrl(),
  onOpen: () => console.log('WebSocket connected'),
  onClose: () => console.log('WebSocket disconnected'),
});

export const trpcWs = createTRPCReact<AppRouter>();

// Configure client with split link (HTTP for queries/mutations, WS for subscriptions)
export const trpcWsClient = trpcWs.createClient({
  links: [
    splitLink({
      condition(op) {
        return op.type === 'subscription';
      },
      true: wsLink({
        client: wsClient,
      }),
      false: httpBatchLink({
        url: '/api/trpc',
      }),
    }),
  ],
});
```

## Batch Query Optimization

### Automatic Request Batching

```typescript
// lib/trpc/batching.ts - Advanced batching configuration
import { httpBatchLink } from '@trpc/client';

export const optimizedBatchLink = httpBatchLink({
  url: '/api/trpc',
  
  // Batch multiple requests into single HTTP call
  maxURLLength: 2083, // Browser URL limit
  
  // Custom batching logic
  batchRequestsOnPath: true,
  
  // Headers for batch requests
  headers() {
    return {
      'x-trpc-source': 'react',
      'x-trpc-batch': 'true',
    };
  },
  
  // Custom fetch implementation for advanced control
  fetch(url, options) {
    return fetch(url, {
      ...options,
      // Add request ID for tracking
      headers: {
        ...options?.headers,
        'x-request-id': crypto.randomUUID(),
      },
    });
  },
});
```

### Query Optimization Patterns

```typescript
// hooks/useOptimizedQueries.ts - Efficient data fetching patterns
import { trpc } from '@/lib/trpc/react';

export function useOptimizedDashboard() {
  // Parallel queries with automatic batching
  const userQuery = trpc.user.getProfile.useQuery();
  const postsQuery = trpc.post.getUserPosts.useQuery(
    { userId: userQuery.data?.id },
    { enabled: !!userQuery.data?.id }
  );
  const notificationsQuery = trpc.notification.getUnread.useQuery();
  
  // Prefetch related data
  const utils = trpc.useUtils();
  
  const prefetchUserDetails = (userId: string) => {
    utils.user.getDetails.prefetch({ userId });
  };
  
  return {
    user: userQuery.data,
    posts: postsQuery.data,
    notifications: notificationsQuery.data,
    isLoading: userQuery.isLoading || postsQuery.isLoading || notificationsQuery.isLoading,
    prefetchUserDetails,
  };
}

// Infinite queries for large datasets
export function useInfinitePostsList() {
  return trpc.post.getInfiniteList.useInfiniteQuery(
    { limit: 20 },
    {
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  );
}
```

## Monorepo Patterns

### Turborepo Structure

```typescript
// apps/web/package.json - Web app configuration
{
  "name": "@acme/web",
  "dependencies": {
    "@acme/api": "workspace:*",
    "@acme/ui": "workspace:*",
    "@acme/db": "workspace:*"
  }
}

// packages/api/package.json - Shared API package
{
  "name": "@acme/api",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "@acme/db": "workspace:*"
  }
}
```

### Shared tRPC Router

```typescript
// packages/api/src/index.ts - Exportable tRPC router
export { appRouter, type AppRouter } from './router';
export { createTRPCContext } from './context';
export type { Context } from './context';

// packages/api/src/router.ts - Main router
import { createTRPCRouter } from './trpc';
import { userRouter } from './routers/user';
import { postRouter } from './routers/post';
import { authRouter } from './routers/auth';

export const appRouter = createTRPCRouter({
  auth: authRouter,
  user: userRouter,
  post: postRouter,
});

export type AppRouter = typeof appRouter;
```

### Cross-Platform Client Setup

```typescript
// packages/trpc-client/src/index.ts - Shared client configuration
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@acme/api';

export const trpc = createTRPCReact<AppRouter>();

export function createTRPCClient(baseUrl: string) {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${baseUrl}/api/trpc`,
        transformer: superjson,
      }),
    ],
  });
}

// Platform-specific implementations
export * from './web';      // Web-specific utilities
export * from './mobile';   // React Native utilities
```

## Performance Optimization

### Caching Strategies

```typescript
// lib/trpc/cache.ts - Advanced caching patterns
import { QueryClient } from '@tanstack/react-query';

export const createOptimizedQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time based on data volatility
        staleTime: (query) => {
          if (query.queryKey[0] === 'user' && query.queryKey[1] === 'profile') {
            return 5 * 60 * 1000; // User profile: 5 minutes
          }
          if (query.queryKey[0] === 'post') {
            return 2 * 60 * 1000; // Posts: 2 minutes
          }
          return 30 * 1000; // Default: 30 seconds
        },
        
        // Cache time for background updates
        cacheTime: 10 * 60 * 1000, // 10 minutes
        
        // Retry logic
        retry: (failureCount, error: any) => {
          if (error?.data?.code === 'UNAUTHORIZED') return false;
          return failureCount < 3;
        },
        
        // Background refetch
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
      
      mutations: {
        // Optimistic updates for better UX
        onMutate: async () => {
          // Cancel outgoing refetches
          await queryClient.cancelQueries();
        },
      },
    },
  });
};
```

### Optimistic Updates

```typescript
// hooks/useOptimisticMutations.ts - Optimistic update patterns
export function useOptimisticPostUpdate() {
  const utils = trpc.useUtils();
  
  return trpc.post.update.useMutation({
    async onMutate(variables) {
      // Cancel outgoing refetches
      await utils.post.getById.cancel({ id: variables.id });
      
      // Snapshot previous value
      const previousPost = utils.post.getById.getData({ id: variables.id });
      
      // Optimistically update
      utils.post.getById.setData(
        { id: variables.id },
        (old) => old ? { ...old, ...variables.data } : undefined
      );
      
      return { previousPost };
    },
    
    onError(err, variables, context) {
      // Rollback on error
      if (context?.previousPost) {
        utils.post.getById.setData({ id: variables.id }, context.previousPost);
      }
    },
    
    onSettled(data, error, variables) {
      // Always refetch to ensure consistency
      utils.post.getById.invalidate({ id: variables.id });
    },
  });
}
```

## Error Handling and Middleware

### Comprehensive Error Handling

```typescript
// lib/trpc/middleware.ts - Error handling middleware
import { TRPCError } from '@trpc/server';
import { middleware } from './init';

export const errorHandlingMiddleware = middleware(async ({ next, path, type }) => {
  const start = Date.now();
  
  try {
    const result = await next();
    
    // Log successful operations
    console.log(`✅ ${type} ${path} - ${Date.now() - start}ms`);
    
    return result;
  } catch (error) {
    // Log errors with context
    console.error(`❌ ${type} ${path} - ${Date.now() - start}ms`, error);
    
    // Transform errors for client consumption
    if (error instanceof Error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: process.env.NODE_ENV === 'development' 
          ? error.message 
          : 'An unexpected error occurred',
        cause: error,
      });
    }
    
    throw error;
  }
});

// Rate limiting middleware
export const rateLimitMiddleware = middleware(async ({ ctx, next, path }) => {
  const userId = ctx.session?.user?.id;
  const key = `rate_limit:${userId || 'anonymous'}:${path}`;
  
  // Implement rate limiting logic here
  // This is a simplified example
  const requests = await redis.incr(key);
  if (requests === 1) {
    await redis.expire(key, 60); // 1 minute window
  }
  
  if (requests > 100) { // 100 requests per minute
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
    });
  }
  
  return next();
});
```

### Client-side Error Boundaries

```typescript
// components/TRPCErrorBoundary.tsx - Error boundary for tRPC
'use client';

import { Component, ReactNode } from 'react';
import { TRPCClientError } from '@trpc/client';

interface Props {
  children: ReactNode;
  fallback?: (error: Error) => ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class TRPCErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: any) {
    // Log to error reporting service
    console.error('tRPC Error Boundary:', error, errorInfo);
    
    if (error instanceof TRPCClientError) {
      // Handle tRPC-specific errors
      console.error('tRPC Error Details:', {
        code: error.data?.code,
        httpStatus: error.data?.httpStatus,
        path: error.data?.path,
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error!);
      }
      
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h2 className="text-lg font-semibold text-red-800">Something went wrong</h2>
          <p className="text-red-600 mt-1">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

## Production Considerations

### Environment Configuration

```typescript
// lib/trpc/config.ts - Production configuration
export const trpcConfig = {
  development: {
    logLevel: 'debug',
    enableDevtools: true,
    enableBatching: true,
    maxBatchSize: 10,
  },
  
  production: {
    logLevel: 'error',
    enableDevtools: false,
    enableBatching: true,
    maxBatchSize: 50,
    
    // Production optimizations
    compression: true,
    timeout: 30000,
    retryAttempts: 3,
    
    // Security settings
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
      credentials: true,
    },
  },
  
  test: {
    logLevel: 'silent',
    enableDevtools: false,
    enableBatching: false,
  },
};
```

### Monitoring and Observability

```typescript
// lib/trpc/monitoring.ts - Production monitoring
import { middleware } from './init';

export const monitoringMiddleware = middleware(async ({ next, path, type, ctx }) => {
  const start = performance.now();
  const requestId = crypto.randomUUID();
  
  try {
    const result = await next();
    const duration = performance.now() - start;
    
    // Log metrics
    console.log(JSON.stringify({
      requestId,
      path,
      type,
      duration,
      userId: ctx.session?.user?.id,
      success: true,
      timestamp: new Date().toISOString(),
    }));
    
    // Send to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // await sendMetrics({ path, type, duration, success: true });
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    
    console.error(JSON.stringify({
      requestId,
      path,
      type,
      duration,
      userId: ctx.session?.user?.id,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }));
    
    throw error;
  }
});
```

## Best Practices

### 1. Router Organization

```typescript
// Organize routers by domain
const appRouter = router({
  // Authentication & Authorization
  auth: authRouter,
  
  // User management
  user: userRouter,
  
  // Content management
  post: postRouter,
  comment: commentRouter,
  
  // Real-time features
  chat: chatRouter,
  notification: notificationRouter,
  
  // Admin features
  admin: adminRouter,
});
```

### 2. Input Validation

```typescript
// Use comprehensive Zod schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  tags: z.array(z.string()).max(10),
  publishedAt: z.date().optional(),
  categoryId: z.string().uuid(),
});

export const postRouter = router({
  create: protectedProcedure
    .input(createPostSchema)
    .mutation(async ({ input, ctx }) => {
      // Implementation
    }),
});
```

### 3. Context Management

```typescript
// Rich context with proper typing
export async function createTRPCContext({ req, res }: CreateNextContextOptions) {
  const session = await getServerSession(req, res, authOptions);
  
  return {
    session,
    db: prisma,
    redis,
    req,
    res,
    // Add utilities
    utils: {
      getUserPermissions: (userId: string) => getUserPermissions(userId),
      logActivity: (activity: string) => logUserActivity(session?.user?.id, activity),
    },
  };
}
```

### 4. Performance Patterns

```typescript
// Implement proper caching and optimization
export const userRouter = router({
  getProfile: publicProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input, ctx }) => {
      // Cache frequently accessed data
      const cacheKey = `user:profile:${input.userId}`;
      const cached = await ctx.redis.get(cacheKey);
      
      if (cached) {
        return JSON.parse(cached);
      }
      
      const user = await ctx.db.user.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          name: true,
          email: true,
          avatar: true,
          // Only select needed fields
        },
      });
      
      if (user) {
        await ctx.redis.setex(cacheKey, 300, JSON.stringify(user)); // 5 min cache
      }
      
      return user;
    }),
});
```

## Conclusion

tRPC provides a powerful foundation for building type-safe, performant applications with Next.js 15. Key benefits include:

1. **End-to-end Type Safety**: Automatic type inference eliminates runtime errors
2. **Developer Experience**: Excellent tooling and debugging capabilities
3. **Performance**: Built-in optimizations like batching and caching
4. **Scalability**: Monorepo patterns support large applications
5. **Real-time Capabilities**: WebSocket subscriptions for live features

For modern applications requiring type safety, real-time features, and excellent developer experience, tRPC represents the current state-of-the-art in API development for TypeScript applications.

### When to Use tRPC

✅ **Use tRPC when:**
- Building TypeScript applications
- Need end-to-end type safety
- Working in monorepo environments
- Require real-time features
- Team values developer experience

❌ **Consider alternatives when:**
- Working with non-TypeScript clients
- Need public API documentation
- Building microservices architecture
- Require REST API compatibility
- Working with legacy systems

The patterns and practices outlined in this research provide a solid foundation for building production-ready applications with tRPC and Next.js 15. 