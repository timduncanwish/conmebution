/**
 * 移动端汉堡菜单组件
 *
 * 功能：
 * - 响应式汉堡图标
 * - 抽屉式导航菜单
 * - 平滑的动画过渡
 * - 触摸友好的交互
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface MobileMenuProps {
  items: Array<{ href: string; label: string }>;
  locale: string;
}

export function MobileMenu({ items, locale }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // 判断当前激活状态
  const isActive = (href: string) => {
    return pathname === href || (href !== `/${locale}` && pathname.startsWith(href));
  };

  // 关闭菜单
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* 汉堡按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden relative z-50 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
        aria-label="Toggle menu"
        aria-expanded={isOpen}
      >
        <motion.div
          initial={false}
          animate={isOpen ? 'open' : 'closed'}
          className="w-6 h-6 relative"
        >
          {/* 顶部线条 */}
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: 45, y: 8 },
            }}
            className="absolute top-0 left-0 w-6 h-0.5 bg-current"
          />
          {/* 中间线条 */}
          <motion.span
            variants={{
              closed: { opacity: 1 },
              open: { opacity: 0 },
            }}
            className="absolute top-3 left-0 w-6 h-0.5 bg-current"
          />
          {/* 底部线条 */}
          <motion.span
            variants={{
              closed: { rotate: 0, y: 0 },
              open: { rotate: -45, y: -8 },
            }}
            className="absolute top-6 left-0 w-6 h-0.5 bg-current"
          />
        </motion.div>
      </button>

      {/* 遮罩层 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeMenu}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* 抽屉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-64 max-w-[80vw] bg-white shadow-xl z-50 lg:hidden overflow-y-auto"
          >
            {/* 关闭按钮 */}
            <div className="flex justify-end p-4 border-b border-gray-200">
              <button
                onClick={closeMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* 菜单项 */}
            <nav className="p-4 space-y-2">
              {items.map((item, index) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    onClick={closeMenu}
                    className={`block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* 底部信息 */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600 text-center">
                Conmebution v1.0
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/**
 * 使用示例：
 *
 * import { MobileMenu } from '@/components/MobileMenu';
 *
 * function Navigation() {
 *   const navItems = [
 *     { href: '/zh', label: '首页' },
 *     { href: '/zh/create', label: '创建' },
 *     // ...
 *   ];
 *
 *   return (
 *     <nav>
 *       {/* 桌面端导航 *\/}
 *       <div className="hidden lg:flex">...</div>
 *
 *       {/* 移动端汉堡菜单 *\/}
 *       <MobileMenu items={navItems} locale="zh" />
 *     </nav>
 *   );
 * }
 */
