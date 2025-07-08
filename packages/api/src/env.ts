import { z } from 'zod';

// Next.js automatically loads .env at the root, so we just need to validate it.
const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env); 