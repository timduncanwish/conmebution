/**
 * 触摸交互优化组件
 *
 * 提供移动端友好的交互组件，符合 WCAG 移动端可访问性标准
 */

'use client';

import { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface TouchButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
}

/**
 * 触摸优化按钮 - 确保触摸目标至少 44x44px
 */
export function TouchButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}: TouchButtonProps) {
  const baseClasses = [
    'inline-flex',
    'items-center',
    'justify-center',
    'font-medium',
    'rounded-lg',
    'transition-all',
    'duration-200',
    'focus:outline-none',
    'focus:ring-2',
    'focus:ring-offset-2',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    // 触摸优化 - 最小尺寸 44x44px
    'min-h-[44px]',
    'min-w-[44px]',
    fullWidth && 'w-full',
  ].filter(Boolean).join(' ');

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 active:scale-95',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500 active:scale-95',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500 active:scale-95',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      className={classes}
      disabled={disabled || isLoading}
      onClick={props.onClick}
      type={props.type}
      form={props.form}
    >
      {isLoading ? (
        <div className="flex items-center">
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          加载中...
        </div>
      ) : (
        children
      )}
    </motion.button>
  );
}

interface TouchCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  isInteractive?: boolean;
}

/**
 * 触摸优化卡片 - 带有触摸反馈
 */
export function TouchCard({
  children,
  onClick,
  className = '',
  isInteractive = true,
}: TouchCardProps) {
  const baseClasses = [
    'bg-white',
    'rounded-lg',
    'shadow-sm',
    'border',
    'border-gray-200',
    'p-4',
    // 触摸优化
    'cursor-pointer',
    'select-none',
    isInteractive && 'active:scale-[0.98]',
    isInteractive && 'transition-transform',
    isInteractive && 'duration-150',
  ].filter(Boolean).join(' ');

  return (
    <motion.div
      whileTap={isInteractive ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </motion.div>
  );
}

interface TouchListItemProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
}

/**
 * 触摸优化列表项 - 适合移动端列表
 */
export function TouchListItem({
  children,
  onClick,
  className = '',
  isActive = false,
}: TouchListItemProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left px-4 py-3 min-h-[48px] flex items-center justify-between bg-white border-b border-gray-200 hover:bg-gray-50 active:bg-gray-100 transition-colors ${isActive ? 'bg-indigo-50' : ''} ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </motion.button>
  );
}

interface TouchIconProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  size?: number;
  className?: string;
}

/**
 * 触摸优化图标按钮 - 确保足够大的触摸区域
 */
export function TouchIcon({
  icon,
  label,
  onClick,
  size = 24,
  className = '',
}: TouchIconProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`p-3 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors ${className}`}
      style={{ touchAction: 'manipulation' }}
      aria-label={label}
    >
      <div style={{ width: size, height: size }}>{icon}</div>
    </motion.button>
  );
}

interface SwipeableProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

/**
 * 可滑动容器 - 支持滑动手势
 */
export function Swipeable({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
}: SwipeableProps) {
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={(e, info) => {
        const swipeThreshold = 50;
        if (info.offset.x > swipeThreshold && onSwipeRight) {
          onSwipeRight();
        } else if (info.offset.x < -swipeThreshold && onSwipeLeft) {
          onSwipeLeft();
        }
      }}
      className={className}
      style={{ touchAction: 'pan-y' }}
    >
      {children}
    </motion.div>
  );
}

/**
 * 长按检测组件
 */
interface LongPressProps {
  children: ReactNode;
  onLongPress: () => void;
  delay?: number;
  className?: string;
}

export function LongPress({
  children,
  onLongPress,
  delay = 500,
  className = '',
}: LongPressProps) {
  let timer: NodeJS.Timeout;

  const handleStart = () => {
    timer = setTimeout(() => {
      onLongPress();
    }, delay);
  };

  const handleEnd = () => {
    clearTimeout(timer);
  };

  return (
    <div
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      className={className}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </div>
  );
}

/**
 * 使用示例：
 *
 * // 触摸优化按钮
 * <TouchButton
 *   variant="primary"
 *   size="md"
 *   onClick={() => console.log('clicked')}
 * >
 *   点击我
 * </TouchButton>
 *
 * // 触摸卡片
 * <TouchCard onClick={() => console.log('card clicked')}>
 *   <h3>标题</h3>
 *   <p>内容</p>
 * </TouchCard>
 *
 * // 可滑动容器
 * <Swipeable
 *   onSwipeLeft={() => console.log('swiped left')}
 *   onSwipeRight={() => console.log('swiped right')}
 * >
 *   <div>滑动我</div>
 * </Swipeable>
 *
 * // 长按检测
 * <LongPress
 *   onLongPress={() => console.log('long pressed')}
 *   delay={500}
 * >
 *   <div>长按我</div>
 * </LongPress>
 */
