/**
 * 优化的图片组件
 *
 * 使用 Next.js Image 组件和懒加载优化图片性能
 */

'use client';

import Image from 'next/image';
import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
}

/**
 * 优化的图片组件
 *
 * 特性：
 * - 自动懒加载
 * - 响应式图片
 * - 现代 WebP/AVIF 格式
 * - 模糊占位符
 * - 加载状态
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error) {
    // 图片加载失败时显示占位符
    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <svg
          className="w-8 h-8 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`relative ${isLoading ? 'animate-pulse bg-gray-200' : ''} ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        quality={quality}
        placeholder={placeholder}
        blurDataURL={blurDataURL}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        }`}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setError(true);
        }}
      />
    </div>
  );
}

/**
 * 头像组件
 * 专门用于用户头像的优化组件
 */
export function Avatar({
  src,
  alt,
  size = 40,
  className = '',
}: {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      sizes={`${size}px`}
      quality={90}
    />
  );
}

/**
 * 响应式图片组件
 * 自动适配不同屏幕尺寸
 */
export function ResponsiveImage({
  src,
  alt,
  className = '',
  aspectRatio = '16/9',
}: {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
}) {
  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio }}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        quality={80}
      />
    </div>
  );
}

/**
 * 背景图片组件
 * 用于背景图片的优化
 */
export function BackgroundImage({
  src,
  alt,
  children,
  className = '',
}: {
  src: string;
  alt: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        sizes="100vw"
        quality={85}
        className="object-cover -z-10"
        priority
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/**
 * 图片库组件
 * 用于展示多张图片的网格
 */
export function ImageGallery({
  images,
  className = '',
}: {
  images: Array<{ src: string; alt: string }>;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {images.map((image, index) => (
        <div key={index} className="relative aspect-square">
          <OptimizedImage
            src={image.src}
            alt={image.alt}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            quality={75}
          />
        </div>
      ))}
    </div>
  );
}

/**
 * 使用示例：
 *
 * // 基本使用
 * <OptimizedImage
 *   src="/images/profile.jpg"
 *   alt="Profile"
 *   width={200}
 *   height={200}
 * />
 *
 * // 头像
 * <Avatar
 *   src="/avatars/user.jpg"
 *   alt="User"
 *   size={50}
 * />
 *
 * // 响应式图片
 * <ResponsiveImage
 *   src="/images/banner.jpg"
 *   alt="Banner"
 *   aspectRatio="21/9"
 * />
 *
 * // 图片库
 * <ImageGallery
 *   images={[
 *     { src: '/img1.jpg', alt: 'Image 1' },
 *     { src: '/img2.jpg', alt: 'Image 2' },
 *   ]}
 * />
 */
