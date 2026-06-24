/**
 * API客户端
 * 封装所有后端API调用
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

// ============ Auth Token Management ============

const TOKEN_KEY = 'conmebution_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

// ============ Helpers ============

const getApiUrl = (path: string): string => `${API_BASE_URL}${path}`;

function getAuthHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleResponse<T = any>(response: Response): Promise<T> {
  if (response.status === 401) {
    clearToken();
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      // Extract locale from current path for correct redirect
      const segments = window.location.pathname.split('/').filter(Boolean);
      const locale = (segments[0] === 'zh' || segments[0] === 'en') ? segments[0] : 'zh';
      window.location.href = `/${locale}/login`;
    }
    throw new Error('Session expired. Please login again.');
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'API request failed');
  }
  return data;
}

async function apiGet<T = any>(path: string): Promise<T> {
  const response = await fetch(getApiUrl(path), { headers: getAuthHeaders() });
  return handleResponse<T>(response);
}

async function apiPost<T = any>(path: string, body?: any): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

async function apiPut<T = any>(path: string, body?: any): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(response);
}

async function apiDelete<T = any>(path: string): Promise<T> {
  const response = await fetch(getApiUrl(path), {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse<T>(response);
}

// ============ Auth API ============

export const authApi = {
  register: (email: string, password: string, name?: string) =>
    apiPost('/api/auth/register', { email, password, name }),

  login: (email: string, password: string) =>
    apiPost('/api/auth/login', { email, password }),

  getMe: () => apiGet('/api/auth/me'),
};

// ============ Content API ============

export const contentApi = {
  list: (params?: { page?: number; limit?: number; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.status) query.set('status', params.status);
    return apiGet(`/api/content?${query}`);
  },

  get: (id: string) => apiGet(`/api/content/${id}`),

  create: (data: { prompt: string; type?: string; generatedContent: any; aiProvider?: string; cost?: number }) =>
    apiPost('/api/content', data),

  update: (id: string, data: { generatedContent?: any; status?: string }) =>
    apiPut(`/api/content/${id}`, data),

  delete: (id: string) => apiDelete(`/api/content/${id}`),
};

// ============ Template API ============

export const templateApi = {
  list: () => apiGet('/api/templates'),

  create: (data: { name: string; promptTemplate: string; type?: string; aiProvider?: string; style?: string; platforms?: string[] }) =>
    apiPost('/api/templates', data),

  update: (id: string, data: any) => apiPut(`/api/templates/${id}`, data),

  delete: (id: string) => apiDelete(`/api/templates/${id}`),
};

// ============ Ideas API (F7 灵感收件箱) ============

export interface Idea {
  id: string;
  title: string;
  note: string | null;
  tags: string[];
  status: 'pending' | 'generated' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export const ideaApi = {
  list: (params?: { status?: string; tag?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.tag) query.set('tag', params.tag);
    const qs = query.toString();
    return apiGet<{ success: boolean; data: Idea[] }>(`/api/ideas${qs ? `?${qs}` : ''}`);
  },

  create: (data: { title: string; note?: string; tags?: string[]; status?: string }) =>
    apiPost<{ success: boolean; data: Idea }>('/api/ideas', data),

  update: (id: string, data: { title?: string; note?: string; tags?: string[]; status?: string }) =>
    apiPut<{ success: boolean; data: Idea }>(`/api/ideas/${id}`, data),

  delete: (id: string) => apiDelete(`/api/ideas/${id}`),
};

// ============ Schedule / Calendar API (F8 内容日历+发布队列) ============

export interface PostingSchedule {
  id: string;
  platform: string;
  timeSlots: string[];
  timezone: string;
  enabled: boolean;
}

export interface ScheduledPost {
  id: string;
  contentId: string;
  postingScheduleId: string | null;
  platforms: string[];
  scheduledTime: string;
  timezone: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  error: string | null;
  createdAt: string;
}

export const scheduleApi = {
  // 时间槽
  listSlots: () => apiGet<{ success: boolean; data: PostingSchedule[] }>('/api/schedule/slots'),

  setSlots: (platform: string, data: { timeSlots: string[]; timezone?: string; enabled?: boolean }) =>
    apiPut<{ success: boolean; data: PostingSchedule }>(`/api/schedule/slots/${platform}`, data),

  deleteSlots: (platform: string) => apiDelete(`/api/schedule/slots/${platform}`),

  // 排期内容
  listPosts: (params?: { from?: string; to?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.from) q.set('from', params.from);
    if (params?.to) q.set('to', params.to);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return apiGet<{ success: boolean; data: ScheduledPost[] }>(`/api/schedule/posts${qs ? `?${qs}` : ''}`);
  },

  createPost: (data: { contentId: string; platforms: string[]; scheduledTime?: string; autoQueue?: boolean; timezone?: string }) =>
    apiPost<{ success: boolean; data: ScheduledPost }>('/api/schedule/posts', data),

  updatePost: (id: string, data: { scheduledTime?: string; platforms?: string[]; status?: string }) =>
    apiPut<{ success: boolean; data: ScheduledPost }>(`/api/schedule/posts/${id}`, data),

  deletePost: (id: string) => apiDelete(`/api/schedule/posts/${id}`),
};

// ============ Settings API (F11 AI 配置 + 成本) ============

export interface ProviderConfig {
  provider: string;
  hasKey: boolean;
  keyMasked: string;
  priority: number;
  enabled: boolean;
}

export interface SettingsData {
  providers: ProviderConfig[];
  monthlyBudget: number;
  autoSelectCheapest: boolean;
  costThisMonth: number;
}

export const settingsApi = {
  get: () => apiGet<{ success: boolean; data: SettingsData }>('/api/settings'),

  saveProvider: (provider: string, data: { apiKey?: string; priority?: number; enabled?: boolean }) =>
    apiPut(`/api/settings/providers/${provider}`, data),

  testProvider: (provider: string) =>
    apiPost<{ success: boolean; data: { provider: string; connected: boolean } }>(`/api/settings/providers/${provider}/test`),

  save: (data: { monthlyBudget?: number; autoSelectCheapest?: boolean }) =>
    apiPut('/api/settings', data),
};

// ============ Inbox API (F12 互动收件箱) ============

export interface Engagement {
  id: string;
  platform: string;
  type: string;
  authorName: string;
  content: string;
  status: 'unread' | 'replied';
  reply: string | null;
  repliedAt: string | null;
  contentId: string | null;
  createdAt: string;
}

export const inboxApi = {
  list: (params?: { platform?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.platform) q.set('platform', params.platform);
    if (params?.status) q.set('status', params.status);
    const qs = q.toString();
    return apiGet<{ success: boolean; data: Engagement[]; meta: { unreadCount: number } }>(`/api/inbox${qs ? `?${qs}` : ''}`);
  },

  sync: () => apiPost<{ success: boolean; data: { created: number } }>('/api/inbox/sync'),

  reply: (id: string, reply: string) =>
    apiPut<{ success: boolean; data: Engagement }>(`/api/inbox/${id}/reply`, { reply }),

  delete: (id: string) => apiDelete(`/api/inbox/${id}`),
};

// ============ Analytics API (F13 可行动分析) ============

export interface AnalyticsSummary {
  overview: { contentGenerated: number; published: number; engagements: number; replied: number; replyRate: number; totalCost: number; totalViews: number; totalLikes: number; totalShares: number };
  byPlatform: { platform: string; published: number; engagements: number; views: number; likes: number }[];
  bestTimes: { platform: string; recommendedSlots: string[]; basis: string }[];
  topContent: { contentId: string; prompt: string; type: string; published: number; engagements: number; views: number }[];
  trend: { date: string; label: string; published: number; engagements: number }[];
  suggestion: string;
}

export const analyticsApi = {
  summary: () => apiGet<{ success: boolean; data: AnalyticsSummary }>('/api/analytics/summary'),
  syncMetrics: () => apiPost<{ success: boolean; data: { updated: number } }>('/api/analytics/sync-metrics'),
};

// ============ Upload API ============

export const uploadFile = async (file: File) => {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(getApiUrl('/api/upload'), {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  return handleResponse(response);
};

// ============ Generation API ============

export const healthCheck = () => apiGet('/api/health');

export const estimateCost = (prompt: string, provider?: string) => {
  const params = new URLSearchParams({ prompt });
  if (provider) params.append('provider', provider);
  return apiGet(`/api/generate/cost?${params}`);
};

export const generateTextSync = (prompt: string, provider?: string, options?: any) =>
  apiPost('/api/generate/text/sync', { prompt, provider, options });

export const generateTextAsync = (prompt: string, provider?: string, options?: any) =>
  apiPost('/api/generate/text', { prompt, provider, options });

export const getTaskStatus = (taskId: string) =>
  apiGet(`/api/generate/tasks/${taskId}`);

export const generateImage = (prompt: string, options?: any) =>
  apiPost('/api/generate/image', { prompt, ...options });

export const generateVideo = (prompt: string, options?: any) =>
  apiPost('/api/generate/video', { prompt, ...options });

// ============ Platform API (F4 单平台 / F6 多平台发布) ============

export interface PublishResult {
  platform: string;
  status: 'success' | 'failed';
  url?: string;
  error?: string;
}

export const publishContent = (contentId: string, platforms: string[]) =>
  apiPost<{ success: boolean; data: { contentId: string; succeeded: number; total: number; results: PublishResult[] } }>(
    '/api/publish',
    { contentId, platforms },
  );

export const getPublishHistory = (contentId?: string) =>
  apiGet(`/api/publish/history${contentId ? `?contentId=${contentId}` : ''}`);

export default {
  auth: authApi,
  content: contentApi,
  template: templateApi,
  idea: ideaApi,
  schedule: scheduleApi,
  inbox: inboxApi,
  analytics: analyticsApi,
  settings: settingsApi,
  upload: uploadFile,
  healthCheck,
  estimateCost,
  generateTextSync,
  generateTextAsync,
  getTaskStatus,
  generateImage,
  generateVideo,
  publishContent,
  getPublishHistory,
};
