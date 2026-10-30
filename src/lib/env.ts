import { z } from 'zod';

export function getEnv(name: string, fallback = ''): string {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

export function requireEnv(name: string): string {
  const value = getEnv(name);
  if (!value) {
    throw new Error(`Environment variable ${name} is required but was not set.`);
  }
  return value;
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
  JWT_SECRET: z.string().min(8).optional(),
  ZARINPAL_MERCHANT_ID: z.string().optional(),
  ZARINPAL_SANDBOX: z.string().optional(),
  POSTEX_API_KEY: z.string().optional(),
  EITAA_API_TOKEN: z.string().optional(),
  EITAA_CHAT_ID: z.string().optional(),
});

export function validateRuntimeEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn('[env] Environment variable validation warnings:', parsed.error.format());
  }
  return parsed.data;
}
