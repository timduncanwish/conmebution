import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Centralized configuration for the backend application
 * All environment variables are loaded and validated here
 */

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  ai: {
    glm: {
      apiKey: process.env.GLM_API_KEY || '',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
    },
    gemini: {
      apiKey: process.env.GEMINI_API_KEY || '',
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  storage: {
    type: process.env.STORAGE_TYPE || 'local',
    local: {
      uploadPath: process.env.UPLOAD_PATH || './uploads',
    }
  }
};

export default config;
