/**
 * 响应式布局组件
 *
 * 提供移动端优化的布局组件和工具
 */

import { ReactNode } from 'react';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * 响应式容器 - 自动适配不同屏幕尺寸
 */
export function ResponsiveContainer({ children, className = '' }: ResponsiveContainerProps) {
  return (
    <div className={`container mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

/**
 * 响应式网格 - 自动调整列数和间距
 */
export function ResponsiveGrid({
  children,
  cols = { sm: 1, md: 2, lg: 3, xl: 4 },
  gap = 4,
  className = '',
}: ResponsiveGridProps) {
  const gridClasses = [
    'grid',
    cols.sm && `grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    `gap-${gap}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={gridClasses}>{children}</div>;
}

interface ResponsiveStackProps {
  children: ReactNode;
  direction?: 'vertical' | 'horizontal';
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
  spacing?: number;
  className?: string;
}

/**
 * 响应式堆栈 - 移动端垂直，桌面端水平
 */
export function ResponsiveStack({
  children,
  direction = 'vertical',
  breakpoint = 'md',
  spacing = 4,
  className = '',
}: ResponsiveStackProps) {
  const isHorizontal = direction === 'horizontal';
  const stackClasses = [
    'flex',
    'flex-col',
    isHorizontal && `${breakpoint}:flex-row`,
    isHorizontal && `${breakpoint}:space-x-${spacing}`,
    !isHorizontal && `space-y-${spacing}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={stackClasses}>{children}</div>;
}

interface ShowAtProps {
  above?: 'sm' | 'md' | 'lg' | 'xl';
  below?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
}

/**
 * 条件显示 - 在特定断点显示/隐藏内容
 */
export function ShowAt({ above, below, children }: ShowAtProps) {
  let className = '';

  if (above) {
    className = `hidden ${above}:block`;
  } else if (below) {
    className = `block ${below}:hidden`;
  }

  return <div className={className}>{children}</div>;
}

interface TouchableProps {
  children: ReactNode;
  onPress?: () => void;
  className?: string;
}

/**
 * 触摸优化按钮 - 增大触摸目标
 */
export function Touchable({ children, onPress, className = '' }: TouchableProps) {
  return (
    <button
      onClick={onPress}
      className={`min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95 transition-transform ${className}`}
      style={{ touchAction: 'manipulation' }}
    >
      {children}
    </button>
  );
}

interface CardGridProps {
  children: ReactNode;
  className?: string;
}

/**
 * 响应式卡片网格 - 适配不同屏幕尺寸
 */
export function CardGrid({ children, className = '' }: CardGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 ${className}`}>
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * 响应式页面头部 - 移动端垂直布局，桌面端水平布局
 */
export function PageHeader({ title, subtitle, actions, className = '' }: PageHeaderProps) {
  return (
    <div className={`mb-6 sm:mb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm sm:text-base text-gray-600">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * 使用示例：
 *
 * // 响应式容器
 * <ResponsiveContainer>
 *   <p>自动适配的容器</p>
 * </ResponsiveContainer>
 *
 * // 响应式网格
 * <ResponsiveGrid cols={{ sm: 1, md: 2, lg: 3 }} gap={4}>
 *   <div>Item 1</div>
 *   <div>Item 2</div>
 *   <div>Item 3</div>
 * </ResponsiveGrid>
 *
 * // 响应式堆栈
 * <ResponsiveStack direction="horizontal" breakpoint="md" spacing={4}>
 *   <div>Left</div>
 *   <div>Right</div>
 * </ResponsiveStack>
 *
 * // 页面头部
 * <PageHeader
 *   title="页面标题"
 *   subtitle="副标题"
 *   actions={<button>操作</button>}
 * />
 */
