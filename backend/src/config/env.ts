import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string(),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),
  CLOUDINARY_CLOUD_NAME: z.string(),
  CLOUDINARY_API_KEY: z.string(),
  CLOUDINARY_API_SECRET: z.string(),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
  OLLAMA_BASE_URL: z.string().default('http://localhost:11434'),
  OLLAMA_MODEL: z.string().default('llava'),
  EXPO_ACCESS_TOKEN: z.string().optional(),
  FRONTEND_URL: z.string(),
  ADMIN_URL: z.string(),
  INVITE_SECRET: z.string()
});

const envParsed = envSchema.safeParse(process.env);

if (!envParsed.success) {
  console.error('Environment variables validation failed:', envParsed.error.format());
  process.exit(1);
}

export const env = envParsed.data;
