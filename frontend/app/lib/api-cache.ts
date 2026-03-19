/**
 * API 响应缓存系统
 *
 * 提供智能缓存机制，减少重复请求，提升性能
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // 缓存生存时间（毫秒）
  maxSize: number; // 最大缓存条目数
}

class ApiCache {
  private cache: Map<string, CacheEntry<any>>;
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map();
    this.config = {
      ttl: 5 * 60 * 1000, // 默认 5 分钟
      maxSize: 100, // 默认最多 100 个缓存条目
      ...config,
    };
  }

  /**
   * 生成缓存键
   */
  private generateKey(url: string, params?: Record<string, any>): string {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  /**
   * 检查缓存是否有效
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * 获取缓存数据
   */
  get<T>(url: string, params?: Record<string, any>): T | null {
    const key = this.generateKey(url, params);
    const entry = this.cache.get(key);

    if (entry && this.isValid(entry)) {
      console.log(`[Cache Hit] ${key}`);
      return entry.data as T;
    }

    if (entry) {
      // 缓存过期，删除
      this.cache.delete(key);
    }

    console.log(`[Cache Miss] ${key}`);
    return null;
  }

  /**
   * 设置缓存数据
   */
  set<T>(url: string, data: T, params?: Record<string, any>, ttl?: number): void {
    const key = this.generateKey(url, params);

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.config.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl || this.config.ttl),
    };

    this.cache.set(key, entry);
    console.log(`[Cache Set] ${key}, expires in ${ttl || this.config.ttl}ms`);
  }

  /**
   * 清除特定缓存
   */
  clear(url: string, params?: Record<string, any>): void {
    const key = this.generateKey(url, params);
    this.cache.delete(key);
    console.log(`[Cache Cleared] ${key}`);
  }

  /**
   * 清除所有缓存
   */
  clearAll(): void {
    this.cache.clear();
    console.log('[Cache Cleared All]');
  }

  /**
   * 清除过期缓存
   */
  clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.config.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        timestamp: entry.timestamp,
        expiresAt: entry.expiresAt,
        remainingTime: Math.max(0, entry.expiresAt - Date.now()),
      })),
    };
  }
}

/**
 * 默认缓存实例
 */
export const apiCache = new ApiCache({
  ttl: 5 * 60 * 1000, // 5 分钟
  maxSize: 100,
});

/**
 * 针对不同类型数据的缓存配置
 */
export const cacheConfigs = {
  // 短期缓存 - 频繁变化的数据
  short: new ApiCache({
    ttl: 1 * 60 * 1000, // 1 分钟
    maxSize: 50,
  }),

  // 中期缓存 - 较少变化的数据
  medium: new ApiCache({
    ttl: 5 * 60 * 1000, // 5 分钟
    maxSize: 100,
  }),

  // 长期缓存 - 很少变化的数据
  long: new ApiCache({
    ttl: 30 * 60 * 1000, // 30 分钟
    maxSize: 200,
  }),

  // 平台列表缓存 - 很少变化
  platforms: new ApiCache({
    ttl: 60 * 60 * 1000, // 1 小时
    maxSize: 10,
  }),

  // 模板缓存 - 较少变化
  templates: new ApiCache({
    ttl: 15 * 60 * 1000, // 15 分钟
    maxSize: 50,
  }),

  // 内容历史缓存 - 中期缓存
  contentHistory: new ApiCache({
    ttl: 3 * 60 * 1000, // 3 分钟
    maxSize: 50,
  }),
};

/**
 * 带缓存的 API 请求函数
 */
export async function fetchWithCache<T>(
  url: string,
  options?: RequestInit & {
    params?: Record<string, any>;
    apiCache?: ApiCache;
    ttl?: number;
  }
): Promise<T> {
  const { params, apiCache: cache = apiCache, ttl, ...fetchOptions } = options || {};

  // 尝试从缓存获取
  const cachedData = cache.get<T>(url, params);
  if (cachedData !== null) {
    return cachedData;
  }

  // 缓存未命中，发起请求
  const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
  const fullUrl = `${url}${queryString}`;

  const response = await fetch(fullUrl, {
    ...fetchOptions,
    headers: {
      'Content-Type': 'application/json',
      ...fetchOptions?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  // 存入缓存
  cache.set(url, data, params, ttl);

  return data;
}

/**
 * React Hook for API 缓存
 */
export function useApiCache<T>(
  url: string,
  options?: RequestInit & {
    params?: Record<string, any>;
    apiCache?: ApiCache;
    ttl?: number;
    enabled?: boolean;
  }
) {
  const [data, setData] = React.useState<T | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const { apiCache: cache = apiCache, enabled = true, ...fetchOptions } = options || {};

  React.useEffect(() => {
    if (!enabled) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchWithCache<T>(url, {
          ...fetchOptions,
          apiCache: cache,
        });
        setData(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [url, enabled]);

  return { data, isLoading, error };
}

// 导入 React（仅在需要时）
import React from 'react';

/**
 * 使用示例：
 *
 * // 基本使用
 * const data = await fetchWithCache('/api/platforms');
 *
 * // 自定义缓存时间
 * const data = await fetchWithCache('/api/content', {
 *   cache: cacheConfigs.short,
 *   ttl: 30000, // 30 秒
 * });
 *
 * // 在组件中使用
 * function MyComponent() {
 *   const { data, isLoading, error } = useApiCache('/api/platforms');
 *
 *   if (isLoading) return <div>加载中...</div>;
 *   if (error) return <div>错误: {error.message}</div>;
 *   return <div>{JSON.stringify(data)}</div>;
 * }
 */
