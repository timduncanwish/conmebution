import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  /* 性能优化配置 */

  // 启用压缩
  compress: true,

  // 图片优化配置
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // 实验性功能 - 启用优化
  experimental: {
    // 启用优化包导入
    optimizePackageImports: ['framer-motion', 'recharts'],
  },

  // 编译优化（Next.js 16 默认使用 SWC，无需手动配置）

  // 生产环境源映射 - 仅在需要时启用
  productionBrowserSourceMaps: false,

  // 静态页面生成缓存
  generateBuildId: async () => {
    return 'conmebution-build'
  },

  // 头部优化
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          }
        ]
      }
    ]
  },

  // Webpack 配置优化
  webpack: (config, { dev, isServer }) => {
    // 生产环境优化
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // 框架包
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // 库包
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name(module: any) {
                const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
                return `lib.${packageName.replace('@', '')}`;
              },
              priority: 30,
              minChunks: 1,
              reuseExistingChunk: true,
            },
            // 公共代码
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      }
    }

    return config
  },
};

export default withNextIntl(nextConfig);
