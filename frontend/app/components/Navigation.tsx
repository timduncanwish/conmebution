/**
 * Main Navigation Component with smooth animations
 * Provides navigation between core pages with enhanced UX
 * Supports both desktop and mobile layouts
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { MobileMenu } from './MobileMenu';

export default function Navigation() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  // 获取当前语言前缀，确保始终是字符串
  const pathSegments = pathname.split('/').filter(Boolean);
  const locale = (pathSegments[0] === 'zh' || pathSegments[0] === 'en') ? pathSegments[0] : 'zh';

  // 构建 href 辅助函数，确保返回字符串
  const createHref = (path: string) => {
    return `/${locale}${path ? `/${path}` : ''}`;
  };

  const navItems = [
    { href: createHref(''), label: t('home') },
    { href: createHref('templates'), label: t('templates') },
    { href: createHref('create'), label: t('create') },
    { href: createHref('content'), label: t('content') },
    { href: createHref('publish'), label: t('publish') },
    { href: createHref('analytics'), label: t('analytics') },
    { href: createHref('settings'), label: t('settings') },
  ];

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo - 始终显示 */}
          <div className="flex items-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={createHref('')} className="text-xl sm:text-2xl font-bold text-indigo-600">
                Conmebution
              </Link>
            </motion.div>
          </div>

          {/* 桌面端导航 - 仅在 lg 以上显示 */}
          <div className="hidden lg:flex lg:items-center lg:space-x-1">
            {navItems.map((item, index) => {
              const isActive = pathname === item.href ||
                               (item.href !== createHref('') && pathname.startsWith(item.href));
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'border-indigo-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <motion.span
                      whileHover={{ y: -2 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {item.label}
                    </motion.span>
                  </Link>
                </motion.div>
              );
            })}
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center space-x-2">
            {/* 设置按钮 - 桌面端显示 */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="hidden sm:block"
            >
              <Link
                href={createHref('settings')}
                className="p-2 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">Settings</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </motion.div>

            {/* 移动端汉堡菜单 - 仅在 lg 以下显示 */}
            <div className="lg:hidden">
              <MobileMenu items={navItems} locale={locale} />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
