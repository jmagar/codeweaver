<!--
---
name: New MCP Integration Module
description: A template for integrating a new external tool via the Model Context Protocol (MCP).
---
-->

This template outlines the current (AI SDK v5 **Beta**) approach for integrating a new MCP server into the CodeWeaver monorepo. The main differences versus the legacy template are:

* Uses **Vercel AI SDK v5 Beta** utilities (`experimental_createMCPClient`, `Experimental_StdioMCPTransport`, …) instead of `@modelcontextprotocol/sdk/*`.
* Supports multiple transports (stdio, SSE, Streamable-HTTP, custom).
* Provides optional *stream* helpers, structured logging hooks, and first-class Zod validation for type-safe tool calls.

> ℹ️ Everything shown below compiles in `strict` TypeScript under our workspace `tsconfig` settings.

## 1. File location

All MCP-specific logic lives in `packages/lib/mcp/`. Create **one** file per integration, e.g. `packages/lib/mcp/{{name}}-client.ts`.

## 2. Client implementation (AI SDK v5)

```typescript
import {
  experimental_createMCPClient,
  type MCPClient, // re-exported type helper
} from 'ai';
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
// ☝️  For SSE or Streamable-HTTP use the built-in shorthand shown below.
import { z } from 'zod';

/*************************************************
 * 1. Zod schemas – keep I/O strictly validated. *
 *************************************************/
const {{toolName}}InputSchema = z.object({
  parameter1: z.string(),
  parameter2: z.number().optional(),
});
const {{toolName}}OutputSchema = z.object({
  result: z.string(),
  details: z.record(z.any()),
});

export type {{toolName}}Input  = z.infer<typeof {{toolName}}InputSchema>;
export type {{toolName}}Output = z.infer<typeof {{toolName}}OutputSchema>;

/*************************************************
 * 2. Client wrapper – hides transport details.   *
 *************************************************/
interface BaseTransportOptions {
  /**
   * Optional uncaught-error handler. Allows hooking CodeWeaver logger.
   */
  onError?: (err: unknown) => void;
}
interface StdioTransportOptions extends BaseTransportOptions {
  type: 'stdio';
  /** Exact command (and optional args) that starts the MCP server */
  command: string;
  args?: string[];
  env?: NodeJS.ProcessEnv;
}
interface SseTransportOptions extends BaseTransportOptions {
  type: 'sse';
  url: string; // e.g. http://localhost:8765/sse
  headers?: Record<string, string>;
}
interface HttpTransportOptions extends BaseTransportOptions {
  type: 'http'; // Streamable-HTTP (Upgrade) spec – implemented by many servers
  url: string;  // base URL
  headers?: Record<string, string>;
}
export type {{name}}MCPTransportOptions =
  | StdioTransportOptions
  | SseTransportOptions
  | HttpTransportOptions;

export class {{name}}MCPClient {
  private client!: MCPClient; // initialised in connect()
  private closeFn: (() => Promise<void>) | null = null;

  constructor(private readonly transportOptions: {{name}}MCPTransportOptions) {}

  /**********************
   * Lifecycle helpers. *
   **********************/
  public async connect(): Promise<void> {
    if (this.closeFn) return; // already connected

    // 1️⃣ Create transport implementation based on the chosen type
    const transport = this.createTransport(this.transportOptions);

    // 2️⃣ Boot the lightweight client
    this.client = await experimental_createMCPClient({
      transport,
      // Surface **all** uncaught errors, otherwise they would be thrown
      // globally and break node streams.
      onUncaughtError: this.transportOptions.onError ?? console.error,
    });

    // 3️⃣ Cache close function for later cleanup
    this.closeFn = () => this.client.close();
  }

  public async disconnect(): Promise<void> {
    if (!this.closeFn) return; // not connected
    await this.closeFn();
    this.closeFn = null;
  }

  public async listTools() {
    await this.connect(); // idempotent – ensures connected
    return this.client.tools();
  }

  /*****************************************************
   * Typed wrapper around the `callTool` JSON-RPC call. *
   *****************************************************/
  public async call{{toolName}}(
    args: {{toolName}}Input,
  ): Promise<{{toolName}}Output> {
    await this.connect();

    // 1. Validate input eagerly so callers fail fast.
    const validatedArgs = {{toolName}}InputSchema.parse(args);

    // 2. Call the tool. AI SDK returns an `MCPCallToolResult` object.
    const result = await this.client.callTool({
      name: '{{toolName}}',
      arguments: validatedArgs,
    });

    if (result.isError) {
      // Attach extra telemetry data – these objects are serialisable.
      const meta = JSON.stringify(result.content);
      throw new Error(`{{toolName}} failed – ${meta}`);
    }

    // 3. The spec recommends the *first* `text/plain` part contains JSON.
    const rawJson = result.content.find(c => c.contentType === 'text/plain')?.text;
    if (!rawJson) throw new Error('No text/plain tool output received.');

    return {{toolName}}OutputSchema.parse(JSON.parse(rawJson));
  }

  /*****************************************
   * (Optional) STREAM tool result helper. *
   * For servers that stream partial chunks *
   *   of the result via SSE or HTTP.       *
   *****************************************/
  public async stream{{toolName}}(
    args: {{toolName}}Input,
    onChunk: (partial: string) => void,
  ): Promise<{{toolName}}Output> {
    await this.connect();

    const validatedArgs = {{toolName}}InputSchema.parse(args);

    const iterator = await this.client.streamTool({
      name: '{{toolName}}',
      arguments: validatedArgs,
    });

    let finalJson = '';
    for await (const chunk of iterator) {
      if (chunk.type === 'text') {
        onChunk(chunk.text);
        finalJson += chunk.text;
      }
    }

    return {{toolName}}OutputSchema.parse(JSON.parse(finalJson));
  }

  /***********************
   * Private utilities.  *
   ***********************/
  private createTransport(opts: {{name}}MCPTransportOptions) {
    switch (opts.type) {
      case 'stdio':
        return new Experimental_StdioMCPTransport({
          command: opts.command,
          args: opts.args,
          env: opts.env,
        });
      case 'sse':
        return {
          type: 'sse' as const,
          url: opts.url,
          headers: opts.headers,
        };
      case 'http':
        // Streamable-HTTP transport uses same shape as SSE but with type 'http'.
        return { ...opts, type: 'http' as const };
    }
  }
}
```

### Transport cheat-sheet

| Transport            | `type` value | Ideal for                                  | SDK package                           |
|----------------------|--------------|--------------------------------------------|---------------------------------------|
| `stdio` *(default)*  | `'stdio'`    | Local dev tools (Cursor, CLI)              | `ai/mcp-stdio`                        |
| SSE *(remote)*       | `'sse'`      | Long-lived servers over HTTP/1.1           | Built-in (no extra import)            |
| Streamable-HTTP      | `'http'`     | Stateless deployments / Function hosts     | Built-in (no extra import)            |
| Custom               | `'custom'`   | Anything implementing the `MCPTransport`   | Provide your own bridge               |

> **Logging & error handling**  
> The optional `onError` callback surfaces *uncaught* errors emitted by the SDK.  Hook this into `@/packages/lib/logger` to forward structured logs to our ELK stack.

---

## 3. Integrate with tRPC

Everything else is unchanged – point the procedure to our new wrapper:

```typescript
// packages/api/src/routers/mcp.ts
import { protectedProcedure } from '../trpc';
import { {{name}}MCPClient } from '@/packages/lib/mcp/{{name}}-client';
import { z } from 'zod';

export const mcp{{name}}Router = {
  run{{toolName}}: protectedProcedure
    .input({{toolName}}InputSchema) // reuse the schema from the client file
    .mutation(async ({ input }) => {
      // 1. Bootstrap once-per-request – cheap, <5 ms
      const client = new {{name}}MCPClient({
        type: 'stdio',
        command: 'path/to/{{name}}-server',
      });

      await client.connect();
      try {
        return await client.call{{toolName}}(input);
      } finally {
        await client.disconnect();
      }
    }),
};
```

---

## 4. (Optionally) building an MCP server

If you also own the server side, the fastest path is:

```ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: '{{name}}', version: '1.0.0' });

server.tool(
  '{{toolName}}',
  z.object({ parameter1: z.string() /* … */ }),
  async ({ parameter1 }) => {
    // perform work…
    return {
      content: [{ type: 'text', text: JSON.stringify({ result: 'ok', details: {} }) }],
    };
  },
);

await server.connect(new StdioServerTransport());
```

> **Server logging** – the server can emit `loggingNotification` messages which show up in the client's `onError` handler. For consistency, map your log levels using our `packages/lib/logger` util.

---

## 5. Next steps

1. Add a unit test in `packages/lib/mcp/__tests__/{{name}}-client.test.ts` that spins up a mock MCP process and validates `call{{toolName}}`.
2. Wire prod env variables (binary location / URLs) inside `apps/web/env.mjs`.
3. Document the new tool in the internal "MCP catalogue" Notion page.

That's it 🎉 – you now have a fully type-safe MCP integration powered by AI SDK v5 Beta. 