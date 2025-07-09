'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink, splitLink, createWSClient, wsLink } from '@trpc/client';
import React, { useState } from 'react';
import superjson from 'superjson';

import { trpc } from './trpc';

export default function TRPCProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient({}));
  const [trpcClient] = useState(() => {
    const wsClient = createWSClient({
      url: 'ws://localhost:3001',
    });

    const link = splitLink({
      condition(op) {
        return op.type === 'subscription';
      },
      true: wsLink({
        client: wsClient,
      }),
      false: httpBatchLink({
        url: '/api/trpc',
        transformer: superjson,
      }),
    });

    return trpc.createClient({
      links: [link],
    });
  });
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
} 