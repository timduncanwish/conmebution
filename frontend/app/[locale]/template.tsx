import { ReactNode } from 'react';
import PageTransition from '../components/PageTransition';

/**
 * Template 组件 - 在每次路由切换时重新渲染
 * 这是实现页面过渡动画的正确位置
 *
 * 注意：Template 会比 Layout 更频繁地重新渲染
 * 所以只将过渡动画放在这里，其他状态管理放在 Layout 中
 */
export default function LocaleTemplate({
  children,
}: {
  children: ReactNode;
}) {
  return <PageTransition>{children}</PageTransition>;
}
