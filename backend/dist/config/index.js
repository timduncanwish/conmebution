"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
// Load environment variables from .env file
dotenv_1.default.config();
/**
 * Zod schema for validating environment variables
 * Ensures all required configuration is present and valid
 */
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().optional().default('4000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).optional().default('development'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    GLM_API_KEY: zod_1.z.string().optional().default(''),
    OPENAI_API_KEY: zod_1.z.string().optional().default(''),
    GEMINI_API_KEY: zod_1.z.string().optional().default(''),
    REDIS_HOST: zod_1.z.string().optional().default('localhost'),
    REDIS_PORT: zod_1.z.string().optional().default('6379'),
    REDIS_PASSWORD: zod_1.z.string().optional().default(''),
    STORAGE_TYPE: zod_1.z.string().optional().default('local'),
    UPLOAD_PATH: zod_1.z.string().optional().default('./uploads'),
});
// Validate environment variables on import
const validateEnv = () => {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
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
const safeParseInt = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? fallback : parsed;
};
exports.config = {
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
exports.default = exports.config;
