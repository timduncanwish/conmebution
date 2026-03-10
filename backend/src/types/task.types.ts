/**
 * Task System Type Definitions
 * Defines types and interfaces for Bull queue task management
 */

/**
 * Task status enum
 */
export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Task type enum
 */
export enum TaskType {
  GENERATE_TEXT = 'generate-text',
  GENERATE_IMAGE = 'generate-image',
  GENERATE_VIDEO = 'generate-video',
  GENERATE_ALL = 'generate-all',
  YOUTUBE_UPLOAD = 'youtube-upload'
}

/**
 * Task progress interface
 */
export interface TaskProgress {
  taskId: string;
  status: TaskStatus;
  progress: number; // 0-100
  currentStep: string;
  result?: any;
  error?: {
    code: string;
    message: string;
  };
  startedAt: Date;
  completedAt?: Date;
}

/**
 * Text generation task data
 */
export interface TextGenerationTaskData {
  taskId: string;
  userId: string;
  prompt: string;
  provider: string;
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  };
}
