import { z } from 'zod';

const envSchema = z.object({
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

export const env = envSchema.parse(process.env); 