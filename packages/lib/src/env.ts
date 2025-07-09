import { z } from 'zod';

export const envSchema = z.object({
  // Database connection string (allow any non-empty string that starts with "postgresql://")
  DATABASE_URL: z
    .string()
    .regex(/^postgresql:\/\//, 'DATABASE_URL must start with "postgresql://"')
    .min(1, 'DATABASE_URL is required.'),

  // tRPC WebSocket server port
  PORT: z.coerce.number().default(3001),

  // AI Provider (OpenAI)
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required.'),

  // Legacy key support (optional)
  OPENROUTER_API_KEY: z.string().optional(),

  // Auth (to be added later)
});

export type Env = z.infer<typeof envSchema>;

/**
 * Factory function to parse environment values against the schema.
 * @param values - An object containing environment variables, e.g., process.env
 * @returns A validated environment configuration object.
 */
export function parseEnv(values: unknown): Env {
  return envSchema.parse(values);
} 