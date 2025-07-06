<!--
---
name: New MCP Integration Module
description: A template for integrating a new external tool via the Model Context Protocol (MCP).
---
-->

This template outlines the steps and code structure for integrating a new MCP server into the CodeWeaver application.

## 1. File Location
- All MCP-related logic should reside in the `packages/lib/mcp/` directory.
- Create a new file for the integration, e.g., `packages/lib/mcp/{{name}}-client.ts`.

## 2. Client Implementation

The following is a boilerplate for a new MCP client. It handles connection, disconnection, and provides a typed method for calling a specific tool.

```typescript
import { Client as MCPClient } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { z } from 'zod';

// Define the input schema for the tool you want to use
const {{toolName}}InputSchema = z.object({
  parameter1: z.string(),
  parameter2: z.number().optional(),
});

// Define the output schema for the tool
const {{toolName}}OutputSchema = z.object({
  result: z.string(),
  details: z.record(z.any()),
});

type {{toolName}}Input = z.infer<typeof {{toolName}}InputSchema>;
type {{toolName}}Output = z.infer<typeof {{toolName}}OutputSchema>;

/**
 * A client for interacting with the {{name}} MCP server.
 */
export class {{name}}MCPClient {
  private client: MCPClient;
  private transport: StdioClientTransport;

  constructor(command: string[]) {
    this.transport = new StdioClientTransport({ command });
    this.client = new MCPClient({
      name: `codeweaver-{{name}}-client`,
      version: '1.0.0',
    });
  }

  /**
   * Connects to the MCP server.
   */
  public async connect(): Promise<void> {
    try {
      await this.client.connect(this.transport);
      console.log(`Successfully connected to {{name}} MCP server.`);
    } catch (error) {
      console.error(`Failed to connect to {{name}} MCP server:`, error);
      throw error;
    }
  }

  /**
   * Disconnects from the MCP server.
   */
  public async disconnect(): Promise<void> {
    await this.client.close();
    console.log(`Disconnected from {{name}} MCP server.`);
  }

  /**
   * Lists all tools available from this MCP server.
   */
  public async listTools(): Promise<any> {
    const result = await this.client.listTools();
    return result.tools;
  }

  /**
   * Executes the '{{toolName}}' tool with validated input and output.
   *
   * @param args The input arguments for the tool.
   * @returns The parsed tool output.
   */
  public async call{{toolName}}(args: {{toolName}}Input): Promise<{{toolName}}Output> {
    // 1. Validate input arguments
    const validatedArgs = {{toolName}}InputSchema.parse(args);

    // 2. Call the tool via MCP
    const response = await this.client.callTool({
      name: '{{toolName}}',
      arguments: validatedArgs,
    });

    if (response.isError) {
      throw new Error(`MCP tool '{{toolName}}' execution failed: ${JSON.stringify(response.content)}`);
    }

    // 3. Extract the primary result (assuming it's the first text part)
    const rawResult = response.content.find(c => c.contentType === 'text/plain')?.text;
    if (!rawResult) {
      throw new Error('No valid text output from tool');
    }

    // 4. Validate and parse the output
    const parsedResult = JSON.parse(rawResult);
    return {{toolName}}OutputSchema.parse(parsedResult);
  }
}
```

## 3. Integration with tRPC

Expose the MCP tool's functionality through a dedicated tRPC procedure in `packages/api`.

```typescript
// packages/api/src/routers/mcp.ts
import { protectedProcedure } from '../trpc';
import { {{name}}MCPClient } from '@/packages/lib/mcp/{{name}}-client'; // Adjust path

export const mcp{{name}}Router = {
  run{{toolName}}: protectedProcedure
    .input(/* Zod schema for input */)
    .mutation(async ({ input, ctx }) => {
      const mcpClient = new {{name}}MCPClient(['path/to/mcp/server/executable']);
      await mcpClient.connect();

      try {
        const result = await mcpClient.call{{toolName}}(input);
        return result;
      } finally {
        await mcpClient.disconnect();
      }
    }),
};
```

This ensures that all interactions with external tools are controlled, authenticated, and managed through our central API. 