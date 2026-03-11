import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

/**
 * Zod schema for validating environment variables
 * Ensures all required configuration is present and valid
 */
const envSchema = z.object({
  PORT: z.string().optional().default('4000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).optional().default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  GLM_API_KEY: z.string().optional().default(''),
  OPENAI_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  REDIS_HOST: z.string().optional().default('localhost'),
  REDIS_PORT: z.string().optional().default('6379'),
  REDIS_PASSWORD: z.string().optional().default(''),
  STORAGE_TYPE: z.string().optional().default('local'),
  UPLOAD_PATH: z.string().optional().default('./uploads'),
});

// Validate environment variables on import
const validateEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => `${issue.path.join('.')} (${issue.message})`).join(', ');
      throw new Error(`Missing or invalid environment variables: ${missingVars}`);
    }
    throw error;
  }
};

/**
 * Centralized configuration for the backend application
 * All environment variables are loaded and validated here
 */
const env = validateEnv();

// Helper function to safely parse integers with fallback
const safeParseInt = (value: string, fallback: number): number => {
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
};

export const config = {
  port: safeParseInt(env.PORT, 4000),
  nodeEnv: env.NODE_ENV,
  databaseUrl: env.DATABASE_URL,
  ai: {
    glm: {
      apiKey: env.GLM_API_KEY,
    },
    openai: {
      apiKey: env.OPENAI_API_KEY,
    },
    gemini: {
      apiKey: env.GEMINI_API_KEY,
    }
  },
  redis: {
    host: env.REDIS_HOST,
    port: safeParseInt(env.REDIS_PORT, 6379),
    password: env.REDIS_PASSWORD,
  },
  storage: {
    type: env.STORAGE_TYPE,
    local: {
      uploadPath: env.UPLOAD_PATH,
    }
  }
};

export default config;
