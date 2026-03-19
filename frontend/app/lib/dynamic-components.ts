/**
 * 动态导入工具 - 优化代码分割
 *
 * 使用动态导入来延迟加载大型组件，减少初始加载体积
 */

import dynamic from 'next/dynamic';

/**
 * 通用动态导入包装器
 * @param componentPath 组件路径
 */
export function createDynamicComponent<T = {}>(
  componentPath: () => Promise<{ default: React.ComponentType<T> }>
) {
  return dynamic(componentPath, {
    ssr: false, // 客户端渲染，减少服务器负载
  });
}

/**
 * 使用示例：
 *
 * // 动态导入重型组件
 * const HeavyComponent = createDynamicComponent(
 *   () => import('@/components/HeavyComponent')
 * );
 *
 * // Next.js 已经自动处理页面的代码分割，不需要动态导入页面
 * // Recharts 等库已经通过 next.config.ts 中的 optimizePackageImports 优化
 */
