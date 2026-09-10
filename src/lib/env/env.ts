import { z } from 'zod';

/**
 * Centralized, validated environment variables.
 * Fail fast at boot if required vars are missing/malformed instead of
 * surfacing confusing errors deep in the app (important for a
 * government system where misconfiguration must be caught early).
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  /** WebSocket URL of the Vosk speech-recognition server (vosk-model/asr_server.py). */
  VITE_VOSK_WS_URL: z.string().url().default('ws://localhost:2700'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(import.meta.env);

  if (!parsed.success) {
    console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration. Check your .env file.');
  }

  return parsed.data;
}

export const env = loadEnv();
