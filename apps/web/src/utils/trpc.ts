import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@codeweaver/api';

export const trpc = createTRPCReact<AppRouter>(); 