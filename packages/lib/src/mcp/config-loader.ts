import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
// @ts-expect-error - external AI SDK types resolved at build/runtime
import { experimental_createMCPClient } from 'ai';
// @ts-expect-error - external AI SDK types resolved at build/runtime
import { Experimental_StdioMCPTransport } from 'ai/mcp-stdio';
// @ts-expect-error - external AI SDK types resolved at build/runtime
import type { MCPClient, TransportConfig } from 'ai/dist/types';

// ---------------------------------------------------------------------------
// Types for the supported config variants -----------------------------------
// ---------------------------------------------------------------------------

// 1. STDIO (default) ---------------------------------------------------------
interface StdioConfig {
  /** Command to spawn, e.g. "npx" or "python" */
  command: string;
  /** Arguments to pass to the command */
  args?: string[];
  /** Environment variables for the child process */
  env?: Record<string, string>;
  /** Working directory for the child process */
  cwd?: string;
  /** What to do with stderr */
  stderr?: 'inherit' | 'ignore' | 'pipe';
  /** Explicitly mark as stdio (optional) */
  transport?: 'stdio';
}

// 2. SSE ---------------------------------------------------------------------
interface SSEConfig {
  transport: 'sse';
  url: string;
  headers?: Record<string, string>;
  name?: string;
}

// 3. Streamable HTTP ---------------------------------------------------------
interface HTTPConfig {
  transport: 'http';
  url: string;
  headers?: Record<string, string>;
  name?: string;
}

export type ServerConfig = StdioConfig | SSEConfig | HTTPConfig;

export interface MCPConfigFile {
  mcpServers: Record<string, ServerConfig>;
  /** optional default server label */
  default?: string;
}

// ---------------------------------------------------------------------------
// Helpers --------------------------------------------------------------------
// ---------------------------------------------------------------------------

/** Expand ${ENV} variables in a string using process.env */
const expandVars = (input: string): string =>
  input.replace(/\$\{([^}]+)\}/g, (_, k) => process.env[k] ?? '');

/** Resolve ~ to the user home directory if present */
const untildify = (p?: string) =>
  p && p.startsWith('~/') ? path.join(os.homedir(), p.slice(2)) : p;

/** Convert one server config block into the transport object AI SDK expects */
function toTransport(conf: ServerConfig): TransportConfig {
  if (conf.transport === 'sse') {
    return {
      type: 'sse',
      url: expandVars(conf.url),
      headers: conf.headers && Object.fromEntries(
        Object.entries(conf.headers).map(([k, v]) => [k, expandVars(v)])
      ),
      name: conf.name,
    } as const;
  }

  if (conf.transport === 'http') {
    return {
      type: 'http',
      url: expandVars(conf.url),
      headers: conf.headers && Object.fromEntries(
        Object.entries(conf.headers).map(([k, v]) => [k, expandVars(v)])
      ),
      name: conf.name,
    } as const;
  }

  // Default: stdio transport
  const std = conf as StdioConfig;
  const cwd = std.cwd ? untildify(expandVars(std.cwd)) : undefined;
  return new Experimental_StdioMCPTransport({
    command: expandVars(std.command),
    args: std.args?.map(expandVars),
    env: std.env && Object.fromEntries(
      Object.entries(std.env).map(([k, v]) => [k, expandVars(v)])
    ),
    ...(cwd ? { cwd } : {}),
    stderr: std.stderr,
  });
}

// ---------------------------------------------------------------------------
// Public API -----------------------------------------------------------------
// ---------------------------------------------------------------------------

/**
 * Reads an mcp-config.json-style file, spins up clients for every entry and
 * returns a map of label → MCPClient (already connected).
 *
 * @param filePath Optional absolute (or cwd-relative) path to the JSON file.
 */
export async function loadMCPConfig(
  filePath: string = path.resolve(process.cwd(), 'mcp-config.json')
): Promise<Record<string, MCPClient>> {
  const raw = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(raw) as MCPConfigFile;

  const clients: Record<string, MCPClient> = {};

  await Promise.all(
    Object.entries(parsed.mcpServers).map(async ([label, conf]) => {
      const client = await experimental_createMCPClient({
        transport: toTransport(conf),
        // eslint-disable-next-line no-console
        onUncaughtError: (e: unknown) => console.error(`[MCP:${label}]`, e),
      });
      clients[label] = client;
    })
  );

  return clients;
}