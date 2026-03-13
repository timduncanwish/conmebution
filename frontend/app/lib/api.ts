/**
 * API客户端
 * 封装所有后端API调用
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/**
 * 生成配置的API基础URL
 */
const getApiUrl = (path: string): string => {
  return `${API_BASE_URL}${path}`;
};

/**
 * 处理API响应
 */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'API请求失败');
  }
  return response.json();
};

/**
 * 健康检查API
 */
export const healthCheck = async () => {
  const response = await fetch(getApiUrl('/api/health'));
  return handleResponse(response);
};

/**
 * 成本估算API
 */
export const estimateCost = async (prompt: string, provider?: string) => {
  const params = new URLSearchParams({ prompt });
  if (provider) params.append('provider', provider);

  const response = await fetch(getApiUrl(`/api/generate/cost?${params}`));
  return handleResponse(response);
};

/**
 * 同步文本生成API
 */
export const generateTextSync = async (prompt: string, provider?: string, options?: any) => {
  const response = await fetch(getApiUrl('/api/generate/text/sync'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      provider,
      options
    })
  });
  return handleResponse(response);
};

/**
 * 异步文本生成API
 */
export const generateTextAsync = async (prompt: string, provider?: string, options?: any) => {
  const response = await fetch(getApiUrl('/api/generate/text'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt,
      provider,
      options
    })
  });
  return handleResponse(response);
};

/**
 * 获取任务状态API
 */
export const getTaskStatus = async (taskId: string) => {
  const response = await fetch(getApiUrl(`/api/generate/tasks/${taskId}`));
  return handleResponse(response);
};

/**
 * 图片生成API
 */
export const generateImage = async (prompt: string, options?: {
  style?: 'natural' | 'vivid' | 'precise';
  quality?: 'standard' | 'hd';
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  n?: number;
}) => {
  const response = await fetch(getApiUrl('/api/generate/image'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options })
  });
  return handleResponse(response);
};

/**
 * 视频生成API
 */
export const generateVideo = async (prompt: string, options?: {
  duration?: 5 | 10 | 15 | 30;
  resolution?: '720p' | '1080p';
  style?: 'product' | 'story' | 'fast' | 'cinematic';
  ratio?: '16:9' | '9:16' | '1:1';
}) => {
  const response = await fetch(getApiUrl('/api/generate/video'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, ...options })
  });
  return handleResponse(response);
};

/**
 * 平台发布API
 */
export const publishToPlatforms = async (contentId: string, platforms: string[], credentials: any) => {
  const response = await fetch(getApiUrl('/api/publish'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentId,
      platforms,
      credentials
    })
  });
  return handleResponse(response);
};

/**
 * 获取平台发布状态API
 */
export const getPublishStatus = async (publishId: string) => {
  const response = await fetch(getApiUrl(`/api/publish/${publishId}`));
  return handleResponse(response);
};

export default {
  healthCheck,
  estimateCost,
  generateTextSync,
  generateTextAsync,
  getTaskStatus,
  generateImage,
  generateVideo,
  publishToPlatforms,
  getPublishStatus
};
